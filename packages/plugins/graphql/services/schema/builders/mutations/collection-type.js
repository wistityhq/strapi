'use strict';

const { extendType } = require('nexus');
const { pipe } = require('lodash/fp');

const { utils } = require('../../../types');
const { actionExists } = require('../../../old/utils');
const { toSingular } = require('../../../old/naming');
const { buildMutation } = require('../../../old/resolvers-builder');

const builderUtils = require('../utils');

const getUniqueAttributesFiltersMap = pipe(
  builderUtils.getUniqueScalarAttributes,
  builderUtils.scalarAttributesToFiltersMap
);

module.exports = () => {
  /**
   *
   * @param {OutputDefinitionBlock} t
   * @param contentType
   */
  const addCreateMutation = (t, contentType) => {
    const { uid, modelName } = contentType;

    const createMutationName = utils.getCreateMutationTypeName(contentType);
    const responseTypeName = utils.getEntityResponseName(contentType);

    const resolverOptions = { resolver: `${uid}.create` };

    // If the action doesn't exist, return early and don't add the mutation
    if (!actionExists(resolverOptions)) {
      return;
    }

    const resolver = buildMutation(toSingular(modelName), resolverOptions);

    t.field(createMutationName, {
      type: responseTypeName,

      args: {
        // Create payload
        data: utils.getContentTypeInputName(contentType),
      },

      async resolve(parent, args, context, info) {
        const res = await resolver(parent, args, context, info);

        return { data: { id: res.id, attributes: res } };
      },
    });
  };

  const addUpdateMutation = (t, contentType) => {
    const { uid, attributes, modelName } = contentType;

    const updateMutationName = utils.getUpdateMutationTypeName(contentType);
    const responseTypeName = utils.getEntityResponseName(contentType);

    const resolverOptions = { resolver: `${uid}.update` };

    // If the action doesn't exist, return early and don't add the mutation
    if (!actionExists(resolverOptions)) {
      return;
    }

    // Only authorize filtering using unique scalar fields for updateOne queries
    const uniqueAttributes = getUniqueAttributesFiltersMap(attributes);

    const resolver = buildMutation(toSingular(modelName), resolverOptions);

    t.field(updateMutationName, {
      type: responseTypeName,

      args: {
        // Query args
        id: utils.getScalarFilterInputTypeName('ID'),
        ...uniqueAttributes,

        // Update payload
        data: utils.getContentTypeInputName(contentType),
      },

      async resolve(parent, args, context, info) {
        // const query = mappers.graphQLFiltersToStrapiQuery(args.params, contentType);

        const res = await resolver(parent, args, context, info);

        return { data: { id: res.id, attributes: res } };
      },
    });
  };

  const addDeleteMutation = (t, contentType) => {
    const { uid, attributes, modelName } = contentType;

    const deleteMutationName = utils.getDeleteMutationTypeName(contentType);
    const responseTypeName = utils.getEntityResponseName(contentType);

    const resolverOptions = { resolver: `${uid}.delete` };

    // If the action doesn't exist, return early and don't add the mutation
    if (!actionExists(resolverOptions)) {
      return;
    }

    // Only authorize filtering using unique scalar fields for updateOne queries
    const uniqueAttributes = getUniqueAttributesFiltersMap(attributes);

    const resolver = buildMutation(toSingular(modelName), resolverOptions);

    t.field(deleteMutationName, {
      type: responseTypeName,

      args: {
        // Query args
        id: utils.getScalarFilterInputTypeName('ID'),
        ...uniqueAttributes,
      },

      async resolve(parent, args, context, info) {
        // const query = mappers.graphQLFiltersToStrapiQuery(args.params, contentType);

        const res = await resolver(parent, args, context, info);

        return { data: { id: res.id, attributes: res } };
      },
    });
  };

  return {
    buildCollectionTypeMutations(contentType) {
      return extendType({
        type: 'Mutation',

        definition(t) {
          addCreateMutation(t, contentType);
          addUpdateMutation(t, contentType);
          addDeleteMutation(t, contentType);
        },
      });
    },
  };
};
