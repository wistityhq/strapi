'use strict';

const { get, difference } = require('lodash/fp');

const { STRAPI_SCALARS } = require('../constants');

const associations = {
  boolean: 'Boolean',
  integer: 'Int',
  string: 'String',
  biginteger: 'Long',
  float: 'Float',
  decimal: 'Float',
  json: 'JSON',
  date: 'Date',
  time: 'Time',
  datetime: 'DateTime',
  timestamp: 'DateTime',
};

const missingStrapiScalars = difference(STRAPI_SCALARS, Object.keys(associations));

if (missingStrapiScalars.length > 0) {
  throw new Error('Some Strapi scalars are not handled in the GraphQL scalars mapper');
}

/**
 * Used to transform a Strapi scalar type into its GraphQL equivalent
 * @param {string} strapiScalar
 * @return {NexusGenScalars}
 */
const strapiScalarToGraphQLScalar = strapiScalar => get(strapiScalar, associations);

module.exports = { strapiScalarToGraphQLScalar };
