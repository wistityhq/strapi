'use strict';

const { entries, mapValues } = require('lodash/fp');

const {
  mappers: { strapiScalarToGraphQLScalar },
  utils: { isScalar, getScalarFilterInputTypeName },
} = require('../../types');

/**
 * Filter an object entries and keep only those whose value is a unique scalar attribute
 * @param {object} attributes
 * @return {Object<string, object>}
 */
const getUniqueScalarAttributes = attributes => {
  const uniqueAttributes = entries(attributes).filter(
    ([, attribute]) => isScalar(attribute) && attribute.unique
  );

  return Object.fromEntries(uniqueAttributes);
};

/**
 * Map each value from an attribute to a FiltersInput type name
 * @param {object} attributes - The attributes object to transform
 * @return {Object<string, string>}
 */
const scalarAttributesToFiltersMap = mapValues(attribute => {
  const gqlScalar = strapiScalarToGraphQLScalar(attribute.type);

  return getScalarFilterInputTypeName(gqlScalar);
});

module.exports = {
  getUniqueScalarAttributes,
  scalarAttributesToFiltersMap,
};
