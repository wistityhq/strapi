'use strict';

const _ = require('lodash');
const { parseMultipartData, sanitizeEntity } = require('@strapi/utils');

const createSanitizeFn = model => data => {
  return sanitizeEntity(data, { model: strapi.getModel(model.uid) });
};

/**
 * default bookshelf controller
 *
 */
module.exports = ({ service, model }) => {
  if (model.kind === 'singleType') {
    return createSingleTypeController({ model, service });
  }

  return createCollectionTypeController({ model, service });
};

/**
 * Returns a single type controller to handle default core-api actions
 */
const createSingleTypeController = ({ model, service }) => {
  const sanitize = createSanitizeFn(model);

  return {
    /**
     * Retrieve single type content
     *
     * @return {Object|Array}
     */
    async find(ctx) {
      const { query } = ctx;
      const entity = await service.find({ params: query });
      return sanitize(entity);
    },

    /**
     * create or update single type content.
     *
     * @return {Object}
     */
    async update(ctx) {
      const { body, query } = ctx.request;

      let entity;
      if (ctx.is('multipart')) {
        const { data, files } = parseMultipartData(ctx);
        entity = await service.createOrUpdate({ params: query, data, files });
      } else {
        entity = await service.createOrUpdate({ params: query, data: body });
      }

      return sanitize(entity);
    },

    async delete(ctx) {
      const { query } = ctx;

      const entity = await service.delete({ params: query });
      return sanitize(entity);
    },
  };
};

/**
 *
 * Returns a collection type controller to handle default core-api actions
 */
const createCollectionTypeController = ({ model, service }) => {
  const sanitize = createSanitizeFn(model);

  return {
    /**
     * Retrieve records.
     *
     * @return {Object|Array}
     */
    async find(ctx) {
      const { query } = ctx;

      // TODO:  cleanup
      const entities = _.has(ctx.query, '_q')
        ? await service.search({ params: query })
        : await service.find({ params: query });

      return sanitize(entities);
    },

    /**
     * Retrieve a record.
     *
     * @return {Object}
     */
    async findOne(ctx) {
      const { id } = ctx.params;
      const { query } = ctx;

      const entity = await service.findOne(id, { params: query });

      return sanitize(entity);
    },

    /**
     * Count records.
     *
     * @return {Number}
     */
    async count(ctx) {
      const { query } = ctx;

      // TODO:  impl
      const count = _.has(ctx.query, '_q')
        ? await service.countSearch({ params: query })
        : await service.count({ params: query });

      return count;
    },

    /**
     * Create a record.
     *
     * @return {Object}
     */
    async create(ctx) {
      // TODO:  impl
      // if (ctx.is('multipart')) {
      //   const { data, files } = parseMultipartData(ctx);
      //   entity = await service.create({ data, files });
      // } else {
      // }

      const { body, query } = ctx.request;

      const entity = await service.create({ params: query, data: body });

      return sanitize(entity);
    },

    /**
     * Update a record.
     *
     * @return {Object}
     */
    async update(ctx) {
      // TODO:  impl
      // let entity;
      // if (ctx.is('multipart')) {
      //   const { data, files } = parseMultipartData(ctx);
      //   entity = await service.update({ id: ctx.params.id }, { data, files });
      // } else {
      // }

      const { id } = ctx.params;
      const { body, query } = ctx.request;

      const entity = await service.update(id, { params: query, data: body });
      return sanitize(entity);
    },

    /**
     * Destroy a record.
     *
     * @return {Object}
     */
    async delete(ctx) {
      const { id } = ctx.params;
      const { query } = ctx;

      const entity = await service.delete(id, { params: query });
      return sanitize(entity);
    },
  };
};
