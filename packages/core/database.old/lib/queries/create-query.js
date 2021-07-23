'use strict';

const pmap = require('p-map');

const { createQueryWithLifecycles, withLifecycles } = require('./helpers');
const { createRelationsCountsQuery } = require('./relations-counts-queries');
const { createFindPageQuery, createSearchPageQuery } = require('./paginated-queries');

/**
 * @param {Object} opts options
 * @param {Object} opts.model The ORM model
 * @param {Object} opts.connectorQuery The ORM queries implementation
 */
module.exports = function createQuery(opts) {
  const { model, connectorQuery } = opts;

  const createFn = createQueryWithLifecycles({
    query: 'create',
    model,
    connectorQuery,
  });

  const createMany = (entities, { concurrency = 100 } = {}, ...rest) => {
    return pmap(entities, entity => createFn(entity, ...rest), {
      concurrency,
      stopOnError: true,
    });
  };

  const findPage = withLifecycles({
    query: 'findPage',
    model,
    fn: createFindPageQuery(connectorQuery),
  });

  const findWithRelationCounts = createRelationsCountsQuery({
    model,
    fn: findPage,
    connectorQuery,
  });

  const searchPage = withLifecycles({
    query: 'searchPage',
    model,
    fn: createSearchPageQuery(connectorQuery),
  });

  const searchWithRelationCounts = createRelationsCountsQuery({
    model,
    fn: searchPage,
    connectorQuery,
  });

  return {
    get model() {
      return model;
    },

    get orm() {
      return model.orm;
    },

    get primaryKey() {
      return model.primaryKey;
    },

    get associations() {
      return model.associations;
    },

    /**
     * Run custom database logic
     */
    custom(mapping) {
      if (typeof mapping === 'function') {
        return mapping.bind(this, { model: this.model });
      }

      if (!mapping[this.orm]) {
        throw new Error(`Missing mapping for orm ${this.orm}`);
      }

      if (typeof mapping[this.orm] !== 'function') {
        throw new Error(`Custom queries must be functions received ${typeof mapping[this.orm]}`);
      }

      return mapping[this.model.orm].call(this, { model: this.model });
    },

    create: createFn,
    createMany,
    update: createQueryWithLifecycles({ query: 'update', model, connectorQuery }),
    delete: createQueryWithLifecycles({ query: 'delete', model, connectorQuery }),
    find: createQueryWithLifecycles({ query: 'find', model, connectorQuery }),
    findOne: createQueryWithLifecycles({ query: 'findOne', model, connectorQuery }),
    count: createQueryWithLifecycles({ query: 'count', model, connectorQuery }),
    search: createQueryWithLifecycles({ query: 'search', model, connectorQuery }),
    countSearch: createQueryWithLifecycles({ query: 'countSearch', model, connectorQuery }),

    // paginated queries
    findPage,
    searchPage,

    searchWithRelationCounts,
    findWithRelationCounts,
  };
};
