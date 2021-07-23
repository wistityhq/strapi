'use strict';

/**
 * Loaders.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

const _ = require('lodash');
const DataLoader = require('dataloader');

module.exports = {
  loaders: {},

  initializeLoader() {
    this.resetLoaders();

    // Create loaders for each relational field (exclude core models & plugins).
    Object.values(strapi.contentTypes).forEach(model => this.createLoader(model.uid));
  },

  resetLoaders() {
    this.loaders = {};
  },

  createLoader(modelUID) {
    if (this.loaders[modelUID]) {
      return this.loaders[modelUID];
    }

    const loadFn = queries => this.batchQuery(modelUID, queries);
    const loadOptions = {
      cacheKeyFn: key => this.serializeKey(key),
    };

    this.loaders[modelUID] = new DataLoader(loadFn, loadOptions);
  },

  serializeKey(key) {
    return _.isObjectLike(key) ? JSON.stringify(key) : key;
  },

  async batchQuery(modelUID, queries) {
    // Extract queries from keys and merge similar queries.
    return Promise.all(queries.map(query => this.makeQuery(modelUID, query)));
  },

  async makeQuery(modelUID, query = {}) {
    if (query.single === true) {
      return strapi.query(modelUID).findOne(query.filters, []);
    }

    return strapi.query(modelUID).find(query.filters, []);
  },
};
