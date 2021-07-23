'use strict';

const { extendType } = require('nexus');
const { pipe } = require('lodash/fp');

const { buildQuery } = require('../../../old/resolvers-builder');
const { toSingular, toPlural } = require('../../../old/naming');
const { actionExists } = require('../../../old/utils');
const { utils, mappers } = require('../../../types');
const builderUtils = require('../utils');

const { args } = require('../../../types');

const getUniqueAttributesFiltersMap = pipe(
  builderUtils.getUniqueScalarAttributes,
  builderUtils.scalarAttributesToFiltersMap
);

const buildCollectionTypeQueries = contentType => {
  return extendType({
    type: 'Query',

    definition(t) {
      addFindOneQuery(t, contentType);
      addFindQuery(t, contentType);
    },
  });
};

/**
 * Register a "find one" query field to the nexus type definition
 * @param {OutputDefinitionBlock<Query>} t
 * @param contentType
 */
const addFindOneQuery = (t, contentType) => {
  const { uid, modelName, attributes } = contentType;

  const findOneQueryName = utils.getFindOneQueryName(contentType);
  const responseTypeName = utils.getEntityResponseName(contentType);

  const resolverOptions = { resolver: `${uid}.findOne` };

  // If the action doesn't exist, return early and don't add the query
  if (!actionExists(resolverOptions)) {
    return;
  }

  const resolver = buildQuery(toSingular(modelName), resolverOptions);

  // Only authorize filtering using unique scalar fields for findOne queries
  const uniqueAttributes = getUniqueAttributesFiltersMap(attributes);

  t.field(findOneQueryName, {
    type: responseTypeName,

    args: {
      id: utils.getScalarFilterInputTypeName('ID'),

      ...uniqueAttributes,
    },

    async resolve(parent, args, context, info) {
      const query = mappers.graphQLFiltersToStrapiQuery(args, contentType);

      const res = await resolver(parent, query, context, info);

      return { data: { id: res.id, attributes: res } };
    },
  });
};

/**
 * Register a "find" query field to the nexus type definition
 * @param {OutputDefinitionBlock<Query>} t
 * @param contentType
 */
const addFindQuery = (t, contentType) => {
  const { uid, modelName } = contentType;

  const findQueryName = utils.getFindQueryName(contentType);
  const responseCollectionTypeName = utils.getEntityResponseCollectionName(contentType);

  const resolverOptions = { resolver: `${uid}.find` };

  // If the action doesn't exist, return early and don't add the query
  if (!actionExists(resolverOptions)) {
    return;
  }

  const resolver = buildQuery(toPlural(modelName), resolverOptions);

  t.field(findQueryName, {
    type: responseCollectionTypeName,

    args: {
      publicationState: args.PublicationStateArg,
      // todo[v4]: to add through i18n plugin
      locale: 'String',
      sort: args.SortArg,
      filters: utils.getFiltersInputTypeName(contentType),
    },

    async resolve(parent, args, context, info) {
      args.filters = mappers.graphQLFiltersToStrapiQuery(args.filters, contentType);

      const res = await resolver(parent, args, context, info);

      return { data: res.map(r => ({ id: r.id, attributes: r })), meta: { pagination: {} } };
    },
  });
};

module.exports = { buildCollectionTypeQueries };
