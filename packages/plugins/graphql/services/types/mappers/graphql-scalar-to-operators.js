'use strict';

const { get } = require('lodash/fp');

const {
  eq,
  gt,
  lt,
  contains,
  endsWith,
  startsWith,
} = require('../../schema/builders/filters/operators');

const associations = {
  // ID
  ID: [eq],
  // Booleans
  Boolean: [eq],
  // Strings
  String: [eq, contains, startsWith, endsWith],
  // Numbers
  Int: [eq, gt, lt],
  Long: [eq, gt, lt],
  Float: [eq, gt, lt],
  // Dates
  Date: [eq, gt, lt],
  Time: [eq, gt, lt],
  DateTime: [eq, gt, lt],
  // Others
  JSON: [eq],
};

const enabledScalars = Object.keys(associations).filter(key => associations[key].length > 0);

const graphqlScalarToOperators = graphqlScalar => get(graphqlScalar, associations);

graphqlScalarToOperators.enabledScalars = enabledScalars;

module.exports = { graphqlScalarToOperators };
