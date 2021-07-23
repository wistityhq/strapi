'use strict';

const pagination = require('./pagination');
const responseCollectionMeta = require('./response-collection-meta');
const publicationState = require('./publication-state');
const filters = require('./filters');

module.exports = {
  internals: {
    pagination,
    responseCollectionMeta,
  },

  enums: {
    publicationState,
  },

  ['filters-inputs']: {
    ...filters,
  },
};
