'use strict';

const { has, prop, pick } = require('lodash/fp');
const { PUBLISHED_AT_ATTRIBUTE } = require('@strapi/utils').contentTypes.constants;

const { getService } = require('../utils');

module.exports = {
  async find(ctx) {
    const { model, targetField } = ctx.params;
    const { _component, ...query } = ctx.request.query;
    const { idsToOmit } = ctx.request.body;

    if (!targetField) {
      return ctx.badRequest();
    }

    const modelDef = _component ? strapi.getModel(_component) : strapi.getModel(model);

    if (!modelDef) {
      return ctx.notFound('model.notFound');
    }

    const attribute = modelDef.attributes[targetField];
    if (!attribute || attribute.type !== 'relation') {
      return ctx.badRequest('targetField.invalid');
    }

    const target = strapi.getModel(attribute.target);

    if (!target) {
      return ctx.notFound('target.notFound');
    }

    if (idsToOmit && Array.isArray(idsToOmit)) {
      query.filters = {
        $and: [
          {
            id: {
              $notIn: idsToOmit,
            },
          },
        ].concat(query.filters || []),
      };
    }

    const entityManager = getService('entity-manager');

    let entities = [];

    if (has('_q', ctx.request.query)) {
      entities = await entityManager.search(query, target.uid);
    } else {
      entities = await entityManager.find(query, target.uid);
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
