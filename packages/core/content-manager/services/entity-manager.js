'use strict';

const { assoc, has, prop, omit } = require('lodash/fp');
const strapiUtils = require('@strapi/utils');

const { sanitizeEntity } = strapiUtils;
const { hasDraftAndPublish } = strapiUtils.contentTypes;
const { PUBLISHED_AT_ATTRIBUTE, CREATED_BY_ATTRIBUTE } = strapiUtils.contentTypes.constants;
const { ENTRY_PUBLISH, ENTRY_UNPUBLISH } = strapiUtils.webhook.webhookEvents;

const omitPublishedAtField = omit(PUBLISHED_AT_ATTRIBUTE);

const emitEvent = (event, fn) => async (entity, model) => {
  const result = await fn(entity, model);

  const modelDef = strapi.getModel(model);

  strapi.eventHub.emit(event, {
    model: modelDef.modelName,
    entry: sanitizeEntity(result, { model: modelDef }),
  });

  return result;
};

const findCreatorRoles = entity => {
  const createdByPath = `${CREATED_BY_ATTRIBUTE}.id`;

  if (has(createdByPath, entity)) {
    const creatorId = prop(createdByPath, entity);
    return strapi.query('strapi::role').findMany({ where: { users: { id: creatorId } } });
  }

  return [];
};

const getDefaultPopulate = (uid, populate) => {
  if (populate) return populate;
  const { attributes } = strapi.getModel(uid);

  return Object.keys(attributes).filter(attributeName => {
    return ['relation', 'component', 'dynamiczone'].includes(attributes[attributeName].type);
  });
};

module.exports = ({ strapi }) => ({
  async assocCreatorRoles(entity) {
    if (!entity) {
      return entity;
    }

    const roles = await findCreatorRoles(entity);
    return assoc(`${CREATED_BY_ATTRIBUTE}.roles`, roles, entity);
  },

  find(opts, uid, populate) {
    const params = { ...opts, populate: getDefaultPopulate(uid, populate) };

    return strapi.entityService.find(uid, { params });
  },

  findPage(opts, uid, populate) {
    const params = { ...opts, populate: getDefaultPopulate(uid, populate) };

    return strapi.entityService.findPage(uid, { params });
  },

  findWithRelationCounts(opts, uid, populate) {
    const params = { ...opts, populate: getDefaultPopulate(uid, populate) };

    return strapi.entityService.findWithRelationCounts(uid, { params });
  },

  search(opts, uid, populate) {
    const params = { ...opts, populate: getDefaultPopulate(uid, populate) };

    return strapi.entityService.search(uid, { params });
  },

  searchPage(opts, uid, populate) {
    const params = { ...opts, populate: getDefaultPopulate(uid, populate) };

    return strapi.entityService.searchPage(uid, { params });
  },

  searchWithRelationCounts(opts, uid, populate) {
    const params = { ...opts, populate: getDefaultPopulate(uid, populate) };

    return strapi.entityService.searchWithRelationCounts(uid, { params });
  },

  count(opts, uid) {
    const params = { ...opts };

    return strapi.entityService.count(uid, { params });
  },

  async findOne(id, uid, populate) {
    const params = { populate: getDefaultPopulate(uid, populate) };

    return strapi.entityService.findOne(uid, id, { params });
  },

  async findOneWithCreatorRoles(id, uid, populate) {
    const entity = await this.findOne(id, uid, populate);

    if (!entity) {
      return entity;
    }

    return this.assocCreatorRoles(entity);
  },

  async create(body, uid) {
    const modelDef = strapi.getModel(uid);
    const publishData = { ...body };

    if (hasDraftAndPublish(modelDef)) {
      publishData[PUBLISHED_AT_ATTRIBUTE] = null;
    }

    const params = { populate: getDefaultPopulate(uid) };

    return strapi.entityService.create(uid, { params, data: publishData });
  },

  update(entity, body, uid) {
    const publishData = omitPublishedAtField(body);

    const params = { populate: getDefaultPopulate(uid) };

    return strapi.entityService.update(uid, entity.id, { params, data: publishData });
  },

  delete(entity, uid) {
    const params = { populate: getDefaultPopulate(uid) };

    return strapi.entityService.delete(uid, entity.id, { params });
  },

  // FIXME: handle relations
  deleteMany(opts, uid) {
    const params = { ...opts };

    return strapi.entityService.deleteMany(uid, { params });
  },

  publish: emitEvent(ENTRY_PUBLISH, async (entity, uid) => {
    if (entity[PUBLISHED_AT_ATTRIBUTE]) {
      throw strapi.errors.badRequest('already.published');
    }

    // validate the entity is valid for publication
    await strapi.entityValidator.validateEntityCreation(strapi.getModel(uid), entity);

    const data = { [PUBLISHED_AT_ATTRIBUTE]: new Date() };

    const params = { populate: getDefaultPopulate(uid) };

    return strapi.entityService.update(uid, entity.id, { params, data });
  }),

  unpublish: emitEvent(ENTRY_UNPUBLISH, (entity, uid) => {
    if (!entity[PUBLISHED_AT_ATTRIBUTE]) {
      throw strapi.errors.badRequest('already.draft');
    }

    const data = { [PUBLISHED_AT_ATTRIBUTE]: null };

    const params = { populate: getDefaultPopulate(uid) };

    return strapi.entityService.update(uid, entity.id, { params, data });
  }),
});
