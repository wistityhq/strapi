'use strict';

const _ = require('lodash');
const { contentTypes: contentTypesUtils } = require('strapi-utils');

const parseMultipartBody = require('../utils/parse-multipart');
const {
  validateGenerateUIDInput,
  validateCheckUIDAvailabilityInput,
  validateUIDField,
} = require('./validation');

const {
  PUBLISHED_AT_ATTRIBUTE,
  CREATED_BY_ATTRIBUTE,
  UPDATED_BY_ATTRIBUTE,
} = contentTypesUtils.constants;

const ACTIONS = {
  read: 'plugins::content-manager.explorer.read',
  create: 'plugins::content-manager.explorer.create',
  edit: 'plugins::content-manager.explorer.update',
  delete: 'plugins::content-manager.explorer.delete',
  publish: 'plugins::content-manager.explorer.publish',
};

const findEntityAndCheckPermissions = async (ability, action, model, id) => {
  const contentManagerService = strapi.plugins['content-manager'].services.contentmanager;
  const entity = await contentManagerService.fetch(model, id);

  if (_.isNil(entity)) {
    throw strapi.errors.notFound();
  }

  const roles = _.has(entity, 'created_by.id')
    ? await strapi.query('role', 'admin').find({ 'users.id': entity[CREATED_BY_ATTRIBUTE].id }, [])
    : [];
  const entityWithRoles = _.set(_.cloneDeep(entity), `${CREATED_BY_ATTRIBUTE}.roles`, roles);

  const pm = strapi.admin.services.permission.createPermissionsManager(ability, action, model);

  if (pm.ability.cannot(pm.action, pm.toSubject(entityWithRoles))) {
    throw strapi.errors.forbidden();
  }

  return { pm, entity: entityWithRoles };
};

module.exports = {
  async generateUID(ctx) {
    const { contentTypeUID, field, data } = await validateGenerateUIDInput(ctx.request.body);

    await validateUIDField(contentTypeUID, field);

    const uidService = strapi.plugins['content-manager'].services.uid;

    ctx.body = {
      data: await uidService.generateUIDField({ contentTypeUID, field, data }),
    };
  },

  async checkUIDAvailability(ctx) {
    const { contentTypeUID, field, value } = await validateCheckUIDAvailabilityInput(
      ctx.request.body
    );

    await validateUIDField(contentTypeUID, field);

    const uidService = strapi.plugins['content-manager'].services.uid;

    const isAvailable = await uidService.checkUIDAvailability({ contentTypeUID, field, value });

    const contentType = strapi.contentTypes[contentTypeUID];
    const { attributes } = contentType;
    const { regex } = attributes[field];

    ctx.body = {
      isAvailable,
      suggestion:
        !isAvailable && _.isEmpty(regex)
          ? await uidService.findUniqueUID({ contentTypeUID, field, value })
          : null,
    };
  },

  /**
   * Returns a list of entities of a content-type matching the query parameters
   */
  async find(ctx) {
    const { userAbility } = ctx.state;
    const { model } = ctx.params;
    const { query } = ctx.request;

    const contentManagerService = strapi.plugins['content-manager'].services.contentmanager;

    const { kind } = strapi.getModel(model);
    const pm = strapi.admin.services.permission.createPermissionsManager(
      userAbility,
      ACTIONS.read,
      model
    );

    if (kind === 'singleType') {
      // fetchAll for a singleType only return one entity
      const entity = await contentManagerService.fetchAll(model, query);

      // allow user with create permission to know a single type is not created
      if (!entity) {
        if (pm.ability.cannot(ACTIONS.create, model)) {
          return ctx.forbidden();
        }

        return ctx.notFound();
      }

      if (pm.ability.cannot(ACTIONS.read, pm.toSubject(entity))) {
        return ctx.forbidden();
      }

      return (ctx.body = pm.sanitize(entity));
    }

    if (pm.ability.cannot(ACTIONS.read, model)) {
      return ctx.forbidden();
    }

    const method = _.has(query, '_q') ? 'search' : 'fetchAll';
    const queryParameters = pm.queryFrom(query);

    const results = await contentManagerService[method](model, queryParameters);

    if (!results) {
      return ctx.notFound();
    }

    ctx.body = pm.sanitize(results);
  },

  /**
   * Returns an entity of a content type by id
   */
  async findOne(ctx) {
    const {
      state: { userAbility },
      params: { model, id },
    } = ctx;

    const { pm, entity } = await findEntityAndCheckPermissions(
      userAbility,
      ACTIONS.read,
      model,
      id
    );

    ctx.body = pm.sanitize(entity);
  },

  /**
   * Returns a count of entities of a content type matching query parameters
   */
  async count(ctx) {
    const {
      state: { userAbility },
      params: { model },
      request,
    } = ctx;
    const contentManagerService = strapi.plugins['content-manager'].services.contentmanager;

    const pm = strapi.admin.services.permission.createPermissionsManager(
      userAbility,
      ACTIONS.read,
      model
    );
    const method = _.has(request.query, '_q') ? 'countSearch' : 'count';
    const query = pm.queryFrom(request.query);

    const count = await contentManagerService[method](model, query);

    ctx.body = {
      count: _.isNumber(count) ? count : _.toNumber(count),
    };
  },

  /**
   * Creates an entity of a content type
   */
  async create(ctx) {
    const {
      state: { userAbility, user },
      params: { model },
      request: { body },
    } = ctx;
    const contentManagerService = strapi.plugins['content-manager'].services.contentmanager;
    const modelDef = strapi.getModel(model);

    const pm = strapi.admin.services.permission.createPermissionsManager(
      userAbility,
      ACTIONS.create,
      model
    );

    if (!pm.isAllowed) {
      throw strapi.errors.forbidden();
    }

    const sanitize = e => pm.pickPermittedFieldsOf(e, { subject: model });

    const { data, files } = ctx.is('multipart') ? parseMultipartBody(ctx) : { data: body };

    const writableData = _.omit(data, contentTypesUtils.getNonWritableAttributes(modelDef));

    await strapi.entityValidator.validateEntityCreation(modelDef, writableData, { isDraft: true });
    const isDraft = contentTypesUtils.hasDraftAndPublish(modelDef);
    await strapi.entityValidator.validateEntityUpdate(modelDef, writableData, { isDraft });

    try {
      const result = await contentManagerService.create(
        {
          data: {
            ...sanitize(writableData),
            [CREATED_BY_ATTRIBUTE]: user.id,
            [UPDATED_BY_ATTRIBUTE]: user.id,
          },
          files,
        },
        { model }
      );

      ctx.body = pm.sanitize(result, { action: ACTIONS.read });

      await strapi.telemetry.send('didCreateFirstContentTypeEntry', { model });
    } catch (error) {
      strapi.log.error(error);
      ctx.badRequest(null, [
        {
          messages: [{ id: error.message, message: error.message, field: error.field }],
          errors: _.get(error, 'data.errors'),
        },
      ]);
    }
  },

  /**
   * Updates an entity of a content type
   */
  async update(ctx) {
    const {
      state: { userAbility, user },
      params: { id, model },
      request: { body },
    } = ctx;

    const contentManagerService = strapi.plugins['content-manager'].services.contentmanager;
    const modelDef = strapi.getModel(model);

    const { pm, entity } = await findEntityAndCheckPermissions(
      userAbility,
      ACTIONS.edit,
      model,
      id
    );

    const sanitize = e => pm.pickPermittedFieldsOf(e, { subject: pm.toSubject(entity) });

    const { data, files } = ctx.is('multipart') ? parseMultipartBody(ctx) : { data: body };

    const writableData = _.omit(data, contentTypesUtils.getNonWritableAttributes(modelDef));

    const isDraft = contentTypesUtils.isDraft(entity, modelDef);
    await strapi.entityValidator.validateEntityUpdate(modelDef, writableData, { isDraft });

    try {
      const result = await contentManagerService.edit(
        { id },
        {
          data: {
            ...sanitize(writableData),
            [UPDATED_BY_ATTRIBUTE]: user.id,
          },
          files,
        },
        { model }
      );

      ctx.body = pm.sanitize(result, { action: ACTIONS.read });
    } catch (error) {
      strapi.log.error(error);
      ctx.badRequest(null, [
        {
          messages: [{ id: error.message, message: error.message, field: error.field }],
          errors: _.get(error, 'data.errors'),
        },
      ]);
    }
  },

  /**
   * Deletes one entity of a content type matching a query
   */
  async delete(ctx) {
    const {
      state: { userAbility },
      params: { id, model },
    } = ctx;
    const contentManagerService = strapi.plugins['content-manager'].services.contentmanager;

    const { pm } = await findEntityAndCheckPermissions(userAbility, ACTIONS.delete, model, id);

    const result = await contentManagerService.delete(model, { id });

    ctx.body = pm.sanitize(result, { action: ACTIONS.read });
  },

  /**
   * Deletes multiple entities of a content type matching a query
   */
  async deleteMany(ctx) {
    const {
      state: { userAbility },
      params: { model },
      request,
    } = ctx;
    const contentManagerService = strapi.plugins['content-manager'].services.contentmanager;
    const pm = strapi.admin.services.permission.createPermissionsManager(
      userAbility,
      ACTIONS.delete,
      model
    );

    const results = await contentManagerService.deleteMany(
      model,
      Object.values(request.query),
      pm.query
    );

    ctx.body = results.map(result => pm.sanitize(result, { action: ACTIONS.read }));
  },

  async publish(ctx) {
    const {
      state: { userAbility },
      params: { model, id },
    } = ctx;

    const contentManagerService = strapi.plugins['content-manager'].services.contentmanager;
    const { entity, pm } = await findEntityAndCheckPermissions(
      userAbility,
      ACTIONS.publish,
      model,
      id
    );

    await strapi.entityValidator.validateEntityCreation(strapi.getModel(model), entity);

    if (entity[PUBLISHED_AT_ATTRIBUTE]) {
      return ctx.badRequest('Already published');
    }

    const publishedEntry = await contentManagerService.publish({ id }, model);

    ctx.body = pm.sanitize(publishedEntry, { action: ACTIONS.read });
  },

  async unpublish(ctx) {
    const {
      state: { userAbility },
      params: { model, id },
    } = ctx;

    const contentManagerService = strapi.plugins['content-manager'].services.contentmanager;
    const { entity, pm } = await findEntityAndCheckPermissions(
      userAbility,
      ACTIONS.publish,
      model,
      id
    );

    if (!entity[PUBLISHED_AT_ATTRIBUTE]) {
      return ctx.badRequest('Already a draft');
    }

    const unpublishedEntry = await contentManagerService.unpublish({ id }, model);

    ctx.body = pm.sanitize(unpublishedEntry, { action: ACTIONS.read });
  },

  async findRelationList(ctx) {
    const { model, targetField } = ctx.params;
    const { _component, ...query } = ctx.request.query;

    const contentManagerServices = strapi.plugins['content-manager'].services;

    if (!targetField) {
      return ctx.badRequest();
    }

    const modelDef = _component ? strapi.db.getModel(_component) : strapi.db.getModel(model);

    if (!modelDef) {
      return ctx.notFound('model.notFound');
    }

    const attr = modelDef.attributes[targetField];
    if (!attr) {
      return ctx.badRequest('targetField.invalid');
    }

    const target = strapi.db.getModelByAssoc(attr);

    if (!target) {
      return ctx.notFound('target.notFound');
    }

    const contentManagerService = contentManagerServices.contentmanager;

    let entities = [];

    if (_.has(ctx.request.query, '_q')) {
      entities = await contentManagerService.search(target.uid, query);
    } else {
      entities = await contentManagerService.fetchAll(target.uid, query);
    }

    if (!entities) {
      return ctx.notFound();
    }

    const modelConfig = _component
      ? await contentManagerServices.components.getConfiguration(modelDef.uid)
      : await contentManagerServices.contenttypes.getConfiguration(modelDef.uid);

    const field = _.get(modelConfig, `metadatas.${targetField}.edit.mainField`, 'id');
    const pickFields = [field, 'id', target.primaryKey, PUBLISHED_AT_ATTRIBUTE];
    const sanitize = d => _.pick(d, pickFields);

    ctx.body = _.isArray(entities) ? entities.map(sanitize) : sanitize(entities);
  },
};
