'use strict';

const { prop, assoc } = require('lodash/fp');
const { MANY_RELATIONS } = require('@strapi/utils').relations.constants;
const { isVisibleAttribute } = require('@strapi/utils').contentTypes;

const createRelationsCountsQuery = ({ model, fn, connectorQuery }) => {
  // fetch counter map
  const fetchCounters = async (...args) => {
    const results = await connectorQuery.fetchRelationCounters(...args);
    return results.reduce((map, { id, count }) => assoc(id, Number(count), map), {});
  };

  return async function(params, populate) {
    const toCount = [];
    const toPopulate = [];

    model.associations
      .filter(assoc => !populate || populate.includes(assoc.alias))
      .forEach(assoc => {
        if (MANY_RELATIONS.includes(assoc.nature) && isVisibleAttribute(model, assoc.alias)) {
          return toCount.push(assoc);
        }

        toPopulate.push(assoc.alias);
      });

    const { results, pagination } = await fn(params, toPopulate);
    const resultsIds = results.map(prop('id'));

    const counters = await Promise.all(
      toCount.map(async ({ alias }) => ({
        field: alias,
        counts: await fetchCounters(alias, resultsIds),
      }))
    );

    results.forEach(entity => {
      counters.forEach(({ field, counts }) => {
        entity[field] = { count: counts[entity.id] || 0 };
      });
    });

    return {
      results,
      pagination,
    };
  };
};

module.exports = {
  createRelationsCountsQuery,
};
