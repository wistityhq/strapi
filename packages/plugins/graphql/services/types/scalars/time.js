'use strict';

const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql');
const { parseType } = require('@strapi/utils');

/**
 * A GraphQL scalar used to store Time (HH:mm:ss.SSS) values
 * @type {GraphQLScalarType}
 */
const TimeScalar = new GraphQLScalarType({
  name: 'Time',

  description: 'A time string with format HH:mm:ss.SSS',

  serialize(value) {
    return parseType({ type: 'time', value });
  },

  parseValue(value) {
    return parseType({ type: 'time', value });
  },

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new TypeError('Time cannot represent non string type');
    }

    const value = ast.value;

    return parseType({ type: 'time', value });
  },
});

module.exports = TimeScalar;
