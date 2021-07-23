'use strict';

const _ = require('lodash');

const { hasDraftAndPublish } = require('@strapi/utils').contentTypes;
const { getService } = require('../utils');
const {
  validateContentTypeInput,
  validateUpdateContentTypeInput,
  validateKind,
} = require('./validation/content-type');

module.exports = {
  async getContentTypes(ctx) {
    const { kind } = ctx.query;

    try {
      await validateKind(kind);
    } catch (error) {
      return ctx.send({ error }, 400);
    }

    const contentTypeService = getService('content-types');

    const contentTypes = Object.keys(strapi.contentTypes)
      .filter(uid => !kind || _.get(strapi.contentTypes[uid], 'kind', 'collectionType') === kind)
      .map(uid => contentTypeService.formatContentType(strapi.contentTypes[uid]));

    ctx.send({
      data: contentTypes,
    });
  },

  getContentType(ctx) {
    const { uid } = ctx.params;

    const contentType = strapi.contentTypes[uid];

    if (!contentType) {
      return ctx.send({ error: 'contentType.notFound' }, 404);
    }

    const contentTypeService = getService('content-types');

    ctx.send({ data: contentTypeService.formatContentType(contentType) });
  },

  async createContentType(ctx) {
    const { body } = ctx.request;

    try {
      await validateContentTypeInput(body);
    } catch (error) {
      return ctx.send({ error }, 400);
    }

    try {
      strapi.reload.isWatching = false;

      const contentTypeService = getService('content-types');

      const contentType = await contentTypeService.createContentType({
        contentType: body.contentType,
        components: body.components,
      });

      const metricsProperties = {
        kind: contentType.kind,
        hasDraftAndPublish: hasDraftAndPublish(contentType.schema),
      };

      if (_.isEmpty(strapi.api)) {
        await strapi.telemetry.send('didCreateFirstContentType', metricsProperties);
      } else {
        await strapi.telemetry.send('didCreateContentType', metricsProperties);
      }

      setImmediate(() => strapi.reload());

      ctx.send({ data: { uid: contentType.uid } }, 201);
    } catch (error) {
      strapi.log.error(error);
      await strapi.telemetry.send('didNotCreateContentType', { error: error.message });
      ctx.send({ error: error.message }, 400);
    }
  },

  async updateContentType(ctx) {
    const { uid } = ctx.params;
    const { body } = ctx.request;

    if (!_.has(strapi.contentTypes, uid)) {
      return ctx.send({ error: 'contentType.notFound' }, 404);
    }

    try {
      await validateUpdateContentTypeInput(body);
    } catch (error) {
      return ctx.send({ error }, 400);
    }

    try {
      strapi.reload.isWatching = false;

      const contentTypeService = getService('content-types');

      const component = await contentTypeService.editContentType(uid, {
        contentType: body.contentType,
        components: body.components,
      });

      setImmediate(() => strapi.reload());

      ctx.send({ data: { uid: component.uid } }, 201);
    } catch (error) {
      strapi.log.error(error);
      ctx.send({ error: error.message }, 400);
    }
  },

  async deleteContentType(ctx) {
    const { uid } = ctx.params;

    if (!_.has(strapi.contentTypes, uid)) {
      return ctx.send({ error: 'contentType.notFound' }, 404);
    }

    try {
      strapi.reload.isWatching = false;

      const contentTypeService = getService('content-types');

      const component = await contentTypeService.deleteContentType(uid);

      setImmediate(() => strapi.reload());

      ctx.send({ data: { uid: component.uid } });
    } catch (error) {
      strapi.log.error(error);
      ctx.send({ error: error.message }, 400);
    }
  },
};
