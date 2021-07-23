'use strict';

const { propOr } = require('lodash/fp');

const {
  hasDraftAndPublish,
  constants: { PUBLISHED_AT_ATTRIBUTE },
} = require('@strapi/utils').contentTypes;

const setPublishedAt = data => {
  data[PUBLISHED_AT_ATTRIBUTE] = propOr(new Date(), PUBLISHED_AT_ATTRIBUTE, data);
};

/**
 *
 * Returns a collection type service to handle default core-api actions
 */
const createCollectionTypeService = ({ model, strapi, utils }) => {
  const { uid } = model;

  const { sanitizeInput, getFetchParams } = utils;

  return {
    find(opts = {}) {
      const params = getFetchParams(opts.params);

      return strapi.entityService.find(uid, { params });
    },

    findOne(entityId, opts = {}) {
      const params = getFetchParams(opts.params);

      return strapi.entityService.findOne(uid, entityId, { params });
    },

    count(opts = {}) {
      const params = getFetchParams(opts.params);

      return strapi.entityService.count(uid, { params });
    },

    create({ params, data, files } = {}) {
      const sanitizedData = sanitizeInput(data);

      if (hasDraftAndPublish(model)) {
        setPublishedAt(sanitizedData);
      }

      // TODO: where to handle files ?
      return strapi.entityService.create(uid, { params, data: sanitizedData, files });
    },

    update(entityId, { params, data, files } = {}) {
      const sanitizedData = sanitizeInput(data);

      // TODO: use get fetch params ?

      // TODO: where to handle files ?

      return strapi.entityService.update(uid, entityId, { params, data: sanitizedData, files });
    },

    delete(entityId, { params } = {}) {
      // TODO: use get fetch params ?

      return strapi.entityService.delete(uid, entityId, { params });
    },

    search(opts = {}) {
      const params = getFetchParams(opts.params);
      return strapi.entityService.search(uid, { params });
    },

    countSearch(opts = {}) {
      const params = getFetchParams(opts.params);
      return strapi.entityService.countSearch(uid, { params });
    },
  };
};

module.exports = createCollectionTypeService;
