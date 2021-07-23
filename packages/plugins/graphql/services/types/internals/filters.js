'use strict';

const { inputObjectType } = require('nexus');

const { getScalarFilterInputTypeName } = require('../utils');
const { graphqlScalarToOperators } = require('../mappers');

const { enabledScalars } = graphqlScalarToOperators;

/**
 * Build a map of filters type for every GraphQL scalars
 * @return {Object<string, NexusInputTypeDef>}
 */
const buildScalarFilters = () => {
  return enabledScalars.reduce((acc, type) => {
    const operators = graphqlScalarToOperators(type);
    const typeName = getScalarFilterInputTypeName(type);

    if (!operators || operators.length === 0) {
      return acc;
    }

    return {
      ...acc,

      [typeName]: inputObjectType({
        name: typeName,

        definition(t) {
          for (const operator of operators) {
            operator.add(t, type);
          }
        },
      }),
    };
  }, {});
};

module.exports = {
  scalars: buildScalarFilters(),
};
