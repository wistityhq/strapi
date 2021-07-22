'use strict';

const { has, prop, pick, concat } = require('lodash/fp');
const { PUBLISHED_AT_ATTRIBUTE } = require('strapi-utils').contentTypes.constants;

const { getService } = require('../utils');

module.exports = {
  async find(ctx) {
    const { model, targetField } = ctx.params;
    const { _component, ...query } = ctx.request.query;
    const { idsToOmit } = ctx.request.body;
    const { userAbility } = ctx.state;

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

    if (idsToOmit && Array.isArray(idsToOmit)) {
      query._where = query._where || {};
      query._where.id_nin = concat(query._where.id_nin || [], idsToOmit);
    }

    const entityManager = getService('entity-manager');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });
    const permissionQuery = permissionChecker.buildReadQuery(query);

    let entities = [];

    if (has('_q', ctx.request.query)) {
      entities = await entityManager.search(permissionQuery, target.uid);
    } else {
      entities = await entityManager.find(permissionQuery, target.uid);
    }

    if (!entities) {
      return ctx.notFound();
    }

    const modelConfig = _component
      ? await getService('components').findConfiguration(modelDef)
      : await getService('content-types').findConfiguration(modelDef);

    const field = prop(`metadatas.${targetField}.edit.mainField`, modelConfig) || 'id';
    const pickFields = [field, 'id', target.primaryKey, PUBLISHED_AT_ATTRIBUTE];

    ctx.body = entities.map(pick(pickFields));
  },
};
