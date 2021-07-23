'use strict';

const _ = require('lodash');
const { has, pick, omit } = require('lodash/fp');
const delegate = require('delegates');

const {
  convertSortQueryParams,
  convertLimitQueryParams,
  convertStartQueryParams,
} = require('@strapi/utils/lib/convert-rest-query-params');

const {
  sanitizeEntity,
  webhook: webhookUtils,
  contentTypes: contentTypesUtils,
  relations: relationsUtils,
} = require('@strapi/utils');

const { MANY_RELATIONS } = relationsUtils.constants;
const { PUBLISHED_AT_ATTRIBUTE } = contentTypesUtils.constants;

const uploadFiles = require('./utils/upload-files');

// TODO: those should be strapi events used by the webhooks not the other way arround
const { ENTRY_CREATE, ENTRY_UPDATE, ENTRY_DELETE } = webhookUtils.webhookEvents;

const omitComponentData = (contentType, data) => {
  const { attributes } = contentType;
  const componentAttributes = Object.keys(attributes).filter(attributeName =>
    contentTypesUtils.isComponentAttribute(attributes[attributeName])
  );

  return omit(componentAttributes, data);
};

module.exports = ctx => {
  const implementation = createDefaultImplementation(ctx);

  const service = {
    implementation,
    decorate(decorator) {
      if (typeof decorator !== 'function') {
        throw new Error(`Decorator must be a function, received ${typeof decorator}`);
      }

      this.implementation = Object.assign({}, this.implementation, decorator(this.implementation));
      return this;
    },
  };

  const delegator = delegate(service, 'implementation');

  // delegate every method in implementation
  Object.keys(service.implementation).forEach(key => delegator.method(key));

  return service;
};

// TODO: move to Controller ?
const transformParamsToQuery = (uid, params = {}) => {
  const model = strapi.getModel(uid);

  const query = {};

  // TODO: check invalid values add defaults ....

  const {
    start,
    page,
    pageSize,
    limit,
    sort,
    filters,
    fields,
    populate,
    publicationState,
  } = params;

  if (page) {
    query.page = Number(page);
  }

  if (pageSize) {
    query.pageSize = Number(pageSize);
  }

  if (start) {
    query.offset = convertStartQueryParams(start);
  }

  if (limit) {
    query.limit = convertLimitQueryParams(limit);
  }

  if (sort) {
    query.orderBy = convertSortQueryParams(sort);
  }

  if (filters) {
    query.where = filters;
  }

  if (fields) {
    query.select = _.castArray(fields);
  }

  if (populate) {
    const { populate } = params;
    query.populate = _.castArray(populate);
  }

  // TODO: move to layer above ?
  if (publicationState && contentTypesUtils.hasDraftAndPublish(model)) {
    const { publicationState = 'live' } = params;

    const liveClause = {
      [PUBLISHED_AT_ATTRIBUTE]: {
        $notNull: true,
      },
    };

    if (publicationState === 'live') {
      query.where = {
        $and: [liveClause].concat(query.where || []),
      };

      // TODO: propagate nested publicationState filter somehow
    }
  }

  return query;
};

const pickSelectionParams = pick(['fields', 'populate']);

const createDefaultImplementation = ({ strapi, db, eventHub, entityValidator }) => ({
  uploadFiles,

  async wrapOptions(options = {}) {
    return options;
  },

  emitEvent(uid, event, entity) {
    const model = strapi.getModel(uid);

    eventHub.emit(event, {
      model: model.modelName,
      entry: sanitizeEntity(entity, { model }),
    });
  },

  async find(uid, opts) {
    const { kind } = strapi.getModel(uid);

    const { params } = await this.wrapOptions(opts, { uid, action: 'find' });

    const query = transformParamsToQuery(uid, params);

    // return first element and ignore filters
    if (kind === 'singleType') {
      return db.query(uid).findOne({});
    }

    return db.query(uid).findMany(query);
  },

  async findPage(uid, opts) {
    const { params } = await this.wrapOptions(opts, { uid, action: 'findPage' });

    const query = transformParamsToQuery(uid, params);

    return db.query(uid).findPage(query);
  },

  async findWithRelationCounts(uid, opts) {
    const model = strapi.getModel(uid);

    const { params } = await this.wrapOptions(opts, { uid, action: 'findWithRelationCounts' });

    const query = transformParamsToQuery(uid, params);

    const { attributes } = model;

    const populate = (query.populate || []).reduce((populate, attributeName) => {
      const attribute = attributes[attributeName];

      if (
        MANY_RELATIONS.includes(attribute.relation) &&
        contentTypesUtils.isVisibleAttribute(model, attributeName)
      ) {
        populate[attributeName] = { count: true };
      } else {
        populate[attributeName] = true;
      }

      return populate;
    }, {});

    const { results, pagination } = await db.query(uid).findPage({
      ...query,
      populate,
    });

    return {
      results,
      pagination,
    };
  },

  async findOne(uid, entityId, opts) {
    const { params } = await this.wrapOptions(opts, { uid, action: 'findOne' });

    const query = transformParamsToQuery(uid, pickSelectionParams(params));

    return db.query(uid).findOne({ ...query, where: { id: entityId } });
  },

  async count(uid, opts) {
    const { params } = await this.wrapOptions(opts, { uid, action: 'count' });

    const query = transformParamsToQuery(uid, params);

    return db.query(uid).count(query);
  },

  async create(uid, opts) {
    const { params, data, files } = await this.wrapOptions(opts, { uid, action: 'create' });

    const model = strapi.getModel(uid);

    const isDraft = contentTypesUtils.isDraft(data, model);
    const validData = await entityValidator.validateEntityCreation(model, data, { isDraft });

    // select / populate
    const query = transformParamsToQuery(uid, pickSelectionParams(params));

    // TODO: wrap into transaction
    const componentData = await createComponents(uid, validData);

    const entity = await db.query(uid).create({
      ...query,
      data: Object.assign(omitComponentData(model, validData), componentData),
    });

    // TODO: implement files outside of the entity service
    // if (files && Object.keys(files).length > 0) {
    //   await this.uploadFiles(entry, files, { model });
    //   entry = await this.findOne({ params: { id: entry.id } }, { model });
    // }

    this.emitEvent(uid, ENTRY_CREATE, entity);

    return entity;
  },

  async update(uid, entityId, opts) {
    const { params, data, files } = await this.wrapOptions(opts, { uid, action: 'update' });

    const model = strapi.getModel(uid);

    const entityToUpdate = await db.query(uid).findOne({ where: { id: entityId } });

    const isDraft = contentTypesUtils.isDraft(entityToUpdate, model);

    const validData = await entityValidator.validateEntityUpdate(model, data, {
      isDraft,
    });

    const query = transformParamsToQuery(uid, pickSelectionParams(params));

    // TODO: wrap in transaction
    const componentData = await updateComponents(uid, entityToUpdate, validData);

    const entity = await db.query(uid).update({
      ...query,
      where: { id: entityId },
      data: Object.assign(omitComponentData(model, validData), componentData),
    });

    // TODO: implement files outside of the entity service
    // if (files && Object.keys(files).length > 0) {
    //   await this.uploadFiles(entry, files, { model });
    //   entry = await this.findOne({ params: { id: entry.id } }, { model });
    // }

    this.emitEvent(uid, ENTRY_UPDATE, entity);

    return entity;
  },

  async delete(uid, entityId, opts) {
    const { params } = await this.wrapOptions(opts, { uid, action: 'delete' });

    // select / populate
    const query = transformParamsToQuery(uid, pickSelectionParams(params));

    const entityToDelete = await db.query(uid).findOne({
      ...query,
      where: { id: entityId },
    });

    if (!entityToDelete) {
      throw new Error('Entity not found');
    }

    await deleteComponents(uid, entityToDelete);
    await db.query(uid).delete({ where: { id: entityToDelete.id } });

    this.emitEvent(uid, ENTRY_DELETE, entityToDelete);

    return entityToDelete;
  },

  async deleteMany(uid, opts) {
    const { params } = await this.wrapOptions(opts, { uid, action: 'delete' });

    // select / populate
    const query = transformParamsToQuery(uid, pickSelectionParams(params));

    return db.query(uid).deleteMany(query);
  },

  // TODO: Implement search features
  async search(uid, opts) {
    const { params, populate } = await this.wrapOptions(opts, { uid, action: 'search' });

    return [];

    // return db.query(uid).search(params, populate);
  },

  async searchWithRelationCounts(uid, opts) {
    const { params, populate } = await this.wrapOptions(opts, {
      uid,
      action: 'searchWithRelationCounts',
    });

    return [];

    // return db.query(uid).searchWithRelationCounts(params, populate);
  },

  async searchPage(uid, opts) {
    const { params, populate } = await this.wrapOptions(opts, { uid, action: 'searchPage' });

    return [];

    // return db.query(uid).searchPage(params, populate);
  },

  async countSearch(uid, opts) {
    const { params } = await this.wrapOptions(opts, { uid, action: 'countSearch' });

    return [];

    // return db.query(uid).countSearch(params);
  },
});

// NOTE: we could generalize the logic to allow CRUD of relation directly in the DB layer
const createComponents = async (uid, data) => {
  const { attributes } = strapi.getModel(uid);

  const componentBody = {};

  for (const attributeName in attributes) {
    const attribute = attributes[attributeName];

    if (!has(attributeName, data)) {
      continue;
    }

    if (attribute.type === 'component') {
      const { component: componentUID, repeatable = false } = attribute;

      const componentValue = data[attributeName];

      if (componentValue === null) {
        continue;
      }

      if (repeatable === true) {
        if (!Array.isArray(componentValue)) {
          throw new Error('Expected an array to create repeatable component');
        }

        const components = await Promise.all(
          componentValue.map(value => {
            return strapi.query(componentUID).create({ data: value });
          })
        );

        componentBody[attributeName] = components.map(({ id }, idx) => {
          // TODO: add & support pivot data in DB
          return id;
        });
      } else {
        const component = await strapi.query(componentUID).create({ data: componentValue });

        // TODO: add & support pivot data in DB
        componentBody[attributeName] = component.id;
      }

      continue;
    }

    // if (attribute.type === 'dynamiczone') {

    //   const dynamiczoneValues = data[attributeName];

    //   if (!Array.isArray(dynamiczoneValues)) {
    //     throw new Error('Expected an array to create repeatable component');
    //   }

    //   const components = await Promise.all(
    //     dynamiczoneValues.map(value => {
    //       return strapi.query(value.__component).create({ data: value });
    //     })
    //   );

    //   componentBody[attributeName] = components.map(({ id }, idx) => {
    //     // TODO: add & support pivot data in DB
    //     return id;
    //   });

    //   continue;
    // }
  }

  return componentBody;
};

const updateOrCreateComponent = (componentUID, value) => {
  // update
  if (has('id', value)) {
    // TODO: verify the compo is associated with the entity
    return strapi.query(componentUID).update({ where: { id: value.id }, data: value });
  }

  // create
  return strapi.query(componentUID).create({ data: value });
};

/*
  delete old components
  create or update
*/
const updateComponents = async (uid, entityToUpdate, data) => {
  const { attributes } = strapi.getModel(uid);

  const componentBody = {};

  for (const attributeName in attributes) {
    const attribute = attributes[attributeName];

    if (!has(attributeName, data)) {
      continue;
    }

    if (attribute.type === 'component') {
      const { component: componentUID, repeatable = false } = attribute;

      const previousValue = await strapi.query(uid).load(entityToUpdate, attributeName);
      const componentValue = data[attributeName];

      // TODO: diff prev & new

      // make diff between prev ids & data ids
      if (componentValue === null) {
        continue;
      }

      if (repeatable === true) {
        if (!Array.isArray(componentValue)) {
          throw new Error('Expected an array to create repeatable component');
        }

        // FIXME: returns null sometimes
        const components = await Promise.all(
          componentValue.map(value => updateOrCreateComponent(componentUID, value))
        );

        componentBody[attributeName] = components.filter(_.negate(_.isNil)).map(({ id }, idx) => {
          // TODO: add & support pivot data in DB
          return id;
        });
      } else {
        const component = await updateOrCreateComponent(componentUID, componentValue);

        // TODO: add & support pivot data in DB
        componentBody[attributeName] = component && component.id;
      }

      continue;
    }

    // if (attribute.type === 'dynamiczone') {
    //   const dynamiczoneValues = data[attributeName];

    //   if (!Array.isArray(dynamiczoneValues)) {
    //     throw new Error('Expected an array to create repeatable component');
    //   }

    //   const components = await Promise.all(
    //     dynamiczoneValues.map(value => updateOrCreateComponent(value.__component, value))
    //   );

    //   componentBody[attributeName] = components.map(({ id }, idx) => {
    //     // TODO: add & support pivot data in DB
    //     return id;
    //   });

    //   continue;
    // }
  }

  return componentBody;
};

const deleteComponents = async (uid, entityToDelete) => {
  const { attributes } = strapi.getModel(uid);

  // TODO:  find components and then delete them
  for (const attributeName in attributes) {
    const attribute = attributes[attributeName];

    if (attribute.type === 'component') {
      const { component: componentUID } = attribute;

      // TODO: need to load before deleting the entry then delete the components then the entry
      const value = await strapi.query(uid).load(entityToDelete, attributeName);

      if (!value) {
        continue;
      }

      if (Array.isArray(value)) {
        await Promise.all(
          value.map(subValue => {
            return strapi.query(componentUID).delete({ where: { id: subValue.id } });
          })
        );
      } else {
        await strapi.query(componentUID).delete({ where: { id: value.id } });
      }

      continue;
    }

    if (attribute.type === 'dynamiczone') {
      continue;
    }
  }
};
