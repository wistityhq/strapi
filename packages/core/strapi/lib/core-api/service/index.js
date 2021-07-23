'use strict';

const _ = require('lodash');

const {
  isSingleType,
  getNonWritableAttributes,
  constants: { DP_PUB_STATE_LIVE },
} = require('@strapi/utils').contentTypes;

const createSingleTypeService = require('./single-type');
const createCollectionTypeService = require('./collection-type');

/**
 * Returns a core api for the provided model
 * @param {{ model: object, strapi: object }} context
 * @returns {object}
 */
const createService = ({ model, strapi }) => {
  const utils = createUtils({ model });

  if (isSingleType(model)) {
    return createSingleTypeService({ model, strapi, utils });
  }

  return createCollectionTypeService({ model, strapi, utils });
};

/**
 * Default limit values from config
 * @return {{maxLimit: number, defaultLimit: number}}
 */
const getLimitConfigDefaults = () => ({
  defaultLimit: _.toNumber(strapi.config.get('api.rest.defaultLimit', 100)),
  maxLimit: _.toNumber(strapi.config.get('api.rest.maxLimit')) || null,
});

const getLimitParam = params => {
  const { defaultLimit, maxLimit } = getLimitConfigDefaults();

  if (params.limit === undefined) {
    return defaultLimit;
  }

  const limit = _.toNumber(params.limit);
  // if there is max limit set and params.limit exceeds this number, return configured max limit
  if (maxLimit && (limit === -1 || limit > maxLimit)) {
    return maxLimit;
  }

  return limit;
};

/**
 * Create default fetch params
 * @param {*} params
 * @returns
 */
const getFetchParams = (params = {}) => {
  return {
    publicationState: DP_PUB_STATE_LIVE,
    ...params,
    limit: getLimitParam(params),
  };
};

/**
 * Mixins
 */
const createUtils = ({ model }) => {
  return {
    // make sure to keep the call to getNonWritableAttributes dynamic
    sanitizeInput: data => _.omit(data, getNonWritableAttributes(model)),
    getFetchParams,
  };
};

module.exports = {
  createService,
  getFetchParams,
};
