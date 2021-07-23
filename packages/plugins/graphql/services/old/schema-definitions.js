/**
 * Schema definition language tools
 */

'use strict';

const _ = require('lodash');

/**
 * Retrieves a type description from its configuration or its related model
 * @return String
 */
const getTypeDescription = (type, model = {}) => {
  const str = _.get(type, '_description') || _.get(model, 'info.description');

  if (str) {
    return `"""\n${str}\n"""\n`;
  }

  return '';
};

/**
 * Receive an Object and return a string which is following the GraphQL specs.
 * @param {Object} fields
 * @param {Object} description
 * @param {Object} model the underlying strapi model of those fields
 * @param {string} type the type of object we are converting to SQL (query, mutation, or fields)
 */
const toSDL = (fields, configurations = {}, model = {}, type = 'field') => {
  if (['query', 'mutation'].includes(type)) {
    return operationToSDL({ fields, configurations });
  }

  return fieldsToSDL({ fields, model, configurations });
};

/**
 * Generated a SDL for a type
 * @param {Object} options
 * @param {Object} options.fields fields to convert to SDL
 * @param {Object} options.configurations fields configurations (descriptions and deprecations)
 * @param {Object} options.model the underlying strapi model of those fields
 */
const fieldsToSDL = ({ fields, configurations, model }) => {
  return Object.entries(fields)
    .map(([key, value]) => {
      const [attr] = key.split('(');
      const attributeName = _.trim(attr);

      const description = _.isString(configurations[attributeName])
        ? configurations[attributeName]
        : _.get(configurations, [attributeName, 'description']) ||
          _.get(model, ['attributes', attributeName, 'description']);

      const deprecated =
        _.get(configurations, [attributeName, 'deprecated']) ||
        _.get(model, ['attributes', attributeName, 'deprecated']);

      return applyMetadatas(`${key}: ${value}`, { description, deprecated });
    })
    .join('\n');
};

/**
 * Generated a SDL for a query or a mutation object
 * @param {Object} options
 * @param {Object} options.fields fields to convert to SDL
 * @param {Object} options.configurations fields configurations (descriptions and deprecations)
 */
const operationToSDL = ({ fields, configurations }) => {
  return Object.entries(fields)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        const [attr] = key.split('(');
        const attributeName = _.trim(attr);

        return applyMetadatas(`${key}: ${value}`, configurations[attributeName]);
      } else {
        const { args = {}, type } = value;

        const query = `${key}${argumentsToSDL(args)}: ${type}`;
        return applyMetadatas(query, configurations[key]);
      }
    })
    .join('\n');
};

/**
 * Converts an object of arguments into graphql SDL
 * @param {object} args arguments
 * @returns {string}
 */
const argumentsToSDL = args => {
  if (_.isEmpty(args)) {
    return '';
  }

  const sdlArgs = Object.entries(args)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  return `(${sdlArgs})`;
};

/**
 * Applies description and deprecated to a field definition
 * @param {string} definition field definition
 * @param {Object} metadatas field metadatas
 * @param {string} metadatas.description field description
 * @param {string} metadatas.deprecated field deprecation
 */
const applyMetadatas = (definition, metadatas = {}) => {
  const { description, deprecated } = metadatas;

  let tmpDef = definition;
  if (description) {
    tmpDef = `"""\n${description}\n"""\n${tmpDef}`;
  }

  if (deprecated) {
    tmpDef = `${tmpDef} @deprecated(reason: "${deprecated}")`;
  }

  return tmpDef;
};

module.exports = {
  toSDL,
  getTypeDescription,
};
