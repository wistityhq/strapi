'use strict';

/**
 * GraphQL.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */
const { filterSchema } = require('@graphql-tools/utils');
const { buildFederatedSchema } = require('@apollo/federation');
const { gql, makeExecutableSchema } = require('apollo-server-koa');
const _ = require('lodash');
const graphql = require('graphql');
const PublicationState = require('../../types/publication-state');
const Types = require('./type-builder');
const buildShadowCrud = require('./shadow-crud');
const { createDefaultSchema, diffResolvers } = require('./utils');
const { toSDL } = require('./schema-definitions');
const { buildQuery, buildMutation } = require('./resolvers-builder');

/**
 * Generate GraphQL schema.
 *
 * @return Schema
 */

const generateSchema = () => {
  const isFederated = _.get(strapi.plugins.graphql.config, 'federation', false);
  const shadowCRUDEnabled = strapi.plugins.graphql.config.shadowCRUD !== false;

  const _schema = strapi.plugins.graphql.config._schema.graphql;

  const ctx = {
    schema: _schema,
  };

  // Generate type definition and query/mutation for models.
  const shadowCRUD = shadowCRUDEnabled ? buildShadowCrud(ctx) : createDefaultSchema();

  // Extract custom definition, query or resolver.
  const { definition, query, mutation, resolver = {} } = _schema;

  // Polymorphic.
  const polymorphicSchema = Types.addPolymorphicUnionType(definition + shadowCRUD.definition);

  const builtResolvers = _.merge({}, shadowCRUD.resolvers, polymorphicSchema.resolvers);

  const extraResolvers = diffResolvers(_schema.resolver, builtResolvers);

  const resolvers = _.merge({}, builtResolvers, buildResolvers(extraResolvers));

  // Return empty schema when there is no model.
  if (_.isEmpty(shadowCRUD.definition) && _.isEmpty(definition)) {
    return {};
  }

  const queryFields = shadowCRUD.query && toSDL(shadowCRUD.query, resolver.Query, null, 'query');

  const mutationFields =
    shadowCRUD.mutation && toSDL(shadowCRUD.mutation, resolver.Mutation, null, 'mutation');

  Object.assign(resolvers, PublicationState.resolver);

  const scalars = Types.getScalars();

  Object.assign(resolvers, scalars);

  const scalarDef = Object.keys(scalars)
    .map(key => `scalar ${key}`)
    .join('\n');

  // Concatenate.
  // Manually defined to avoid exposing all attributes (like password etc.)
  let typeDefs = `
      ${definition}
      ${shadowCRUD.definition}
      ${polymorphicSchema.definition}
      ${Types.addInput()}

      ${PublicationState.definition}

      type AdminUser {
        id: ID!
        username: String
        firstname: String!
        lastname: String!
      }

      type Query {
        ${queryFields}
        ${query}
      }

      type Mutation {
        ${mutationFields}
        ${mutation}
      }
      ${scalarDef}
    `;

  // Build schema.
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const generatedSchema = filterDisabledResolvers(schema, extraResolvers);

  if (strapi.config.environment !== 'production') {
    writeGenerateSchema(generatedSchema);
  }

  return isFederated ? getFederatedSchema(generatedSchema, resolvers) : generatedSchema;
};

const getFederatedSchema = (schema, resolvers) =>
  buildFederatedSchema([{ typeDefs: gql(graphql.printSchema(schema)), resolvers }]);

const filterDisabledResolvers = (schema, extraResolvers) =>
  filterSchema({
    schema,
    rootFieldFilter: (operationName, fieldName) => {
      const resolver = _.get(extraResolvers[operationName], fieldName, true);

      // resolvers set to false are filtered from the schema
      if (resolver === false) {
        return false;
      }
      return true;
    },
  });

/**
 * Save into a file the readable GraphQL schema.
 *
 * @return void
 */
const writeGenerateSchema = schema => {
  const printSchema = graphql.printSchema(schema);
  return strapi.fs.writeAppFile('exports/graphql/schema.graphql', printSchema);
};

const buildResolvers = resolvers => {
  // Transform object to only contain function.
  return Object.keys(resolvers).reduce((acc, type) => {
    if (graphql.isScalarType(resolvers[type])) {
      return acc;
    }

    return Object.keys(resolvers[type]).reduce((acc, resolverName) => {
      const resolverObj = resolvers[type][resolverName];

      // Disabled this query.
      if (resolverObj === false) return acc;

      if (_.isFunction(resolverObj)) {
        return _.set(acc, [type, resolverName], resolverObj);
      }

      switch (type) {
        case 'Mutation': {
          _.set(acc, [type, resolverName], buildMutation(resolverName, resolverObj));

          break;
        }
        default: {
          _.set(acc, [type, resolverName], buildQuery(resolverName, resolverObj));
          break;
        }
      }

      return acc;
    }, acc);
  }, {});
};

module.exports = {
  generateSchema,
};
