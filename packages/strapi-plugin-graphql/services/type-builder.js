'use strict';

/**
 * Types.js service
 *
 * @description: A set of functions to make the schema easier to build.
 */

const _ = require('lodash');
const { GraphQLUpload } = require('graphql-upload');
const graphql = require('graphql');
const { GraphQLJSON } = require('graphql-type-json');
const { GraphQLDate, GraphQLDateTime } = require('graphql-iso-date');
const GraphQLLong = require('graphql-type-long');

const Time = require('../types/time');
const { toSingular, toInputName } = require('./naming');

const isScalarAttribute = ({ type }) => type && !['component', 'dynamiczone'].includes(type);

module.exports = {
  /**
   * Convert Strapi type to GraphQL type.
   * @param {Object} attribute Information about the attribute.
   * @param {Object} attribute.definition Definition of the attribute.
   * @param {String} attribute.modelName Name of the model which owns the attribute.
   * @param {String} attribute.attributeName Name of the attribute.
   * @return String
   */

  convertType({
    attribute = {},
    modelName = '',
    attributeName = '',
    rootType = 'query',
    action = '',
  }) {
    // Type
    if (isScalarAttribute(attribute)) {
      let type = 'String';

      switch (attribute.type) {
        case 'boolean':
          type = 'Boolean';
          break;
        case 'integer':
          type = 'Int';
          break;
        case 'biginteger':
          type = 'Long';
          break;
        case 'float':
        case 'decimal':
          type = 'Float';
          break;
        case 'json':
          type = 'JSON';
          break;
        case 'date':
          type = 'Date';
          break;
        case 'time':
          type = 'Time';
          break;
        case 'datetime':
        case 'timestamp':
          type = 'DateTime';
          break;
        case 'enumeration':
          type = this.convertEnumType(attribute, modelName, attributeName);
          break;
      }

      if (attribute.required) {
        if (rootType !== 'mutation' || (action !== 'update' && attribute.default === undefined)) {
          type += '!';
        }
      }

      return type;
    }

    if (attribute.type === 'component') {
      const { required, repeatable, component } = attribute;

      const globalId = strapi.components[component].globalId;

      let typeName = required === true ? `${globalId}` : globalId;

      if (rootType === 'mutation') {
        typeName =
          action === 'update'
            ? `edit${_.upperFirst(toSingular(globalId))}Input`
            : `${_.upperFirst(toSingular(globalId))}Input${required ? '!' : ''}`;
      }

      if (repeatable === true) {
        return `[${typeName}]`;
      }
      return `${typeName}`;
    }

    if (attribute.type === 'dynamiczone') {
      const { required } = attribute;

      const unionName = `${modelName}${_.upperFirst(_.camelCase(attributeName))}DynamicZone`;

      let typeName = unionName;

      if (rootType === 'mutation') {
        typeName = `${unionName}Input!`;
      }

      return `[${typeName}]${required ? '!' : ''}`;
    }

    const ref = attribute.model || attribute.collection;

    // Association
    if (ref && ref !== '*') {
      // Add bracket or not
      const globalId = strapi.db.getModel(ref, attribute.plugin).globalId;
      const plural = !_.isEmpty(attribute.collection);

      if (plural) {
        if (rootType === 'mutation') {
          return '[ID]';
        }

        return `[${globalId}!]!`;
      }

      if (rootType === 'mutation') {
        return 'ID';
      }

      return globalId;
    }

    if (rootType === 'mutation') {
      return attribute.model ? 'ID' : '[ID]';
    }

    return attribute.model ? 'Morph' : '[Morph]';
  },

  /**
   * Convert Strapi enumeration to GraphQL Enum.
   * @param {Object} definition Definition of the attribute.
   * @param {String} model Name of the model which owns the attribute.
   * @param {String} field Name of the attribute.
   * @return String
   */

  convertEnumType(definition, model, field) {
    return definition.enumName
      ? definition.enumName
      : `ENUM_${model.toUpperCase()}_${field.toUpperCase()}`;
  },

  /**
   * Add custom scalar type such as JSON.
   *
   * @return void
   */

  getScalars() {
    return {
      JSON: GraphQLJSON,
      DateTime: GraphQLDateTime,
      Time,
      Date: GraphQLDate,
      Long: GraphQLLong,
      Upload: GraphQLUpload,
    };
  },

  /**
   * Add Union Type that contains the types defined by the user.
   *
   * @return string
   */

  addPolymorphicUnionType(definition) {
    const types = graphql
      .parse(definition)
      .definitions.filter(def => def.kind === 'ObjectTypeDefinition' && def.name.value !== 'Query')
      .map(def => def.name.value);

    if (types.length > 0) {
      return {
        definition: `union Morph = ${types.join(' | ')}`,
        resolvers: {
          Morph: {
            __resolveType(obj) {
              return obj.kind || obj.__contentType || null;
            },
          },
        },
      };
    }

    return {
      definition: '',
      resolvers: {},
    };
  },

  addInput() {
    return `
      input InputID { id: ID!}
    `;
  },

  generateInputModel(model, name, { allowIds = false } = {}) {
    const globalId = model.globalId;
    const inputName = `${_.upperFirst(toSingular(name))}Input`;

    if (_.isEmpty(model.attributes)) {
      return `
      input ${inputName} {
        _: String
      }

      input edit${inputName} {
        ${allowIds ? 'id: ID' : '_: String'}
      }
     `;
    }

    const inputs = `
      input ${inputName} {

        ${Object.keys(model.attributes)
          .map(attributeName => {
            return `${attributeName}: ${this.convertType({
              attribute: model.attributes[attributeName],
              modelName: globalId,
              attributeName,
              rootType: 'mutation',
            })}`;
          })
          .join('\n')}
      }

      input edit${inputName} {
        ${allowIds ? 'id: ID' : ''}
        ${Object.keys(model.attributes)
          .map(attributeName => {
            return `${attributeName}: ${this.convertType({
              attribute: model.attributes[attributeName],
              modelName: globalId,
              attributeName,
              rootType: 'mutation',
              action: 'update',
            })}`;
          })
          .join('\n')}
      }
    `;

    return inputs;
  },

  generateInputPayloadArguments({ model, name, mutationName, action }) {
    const singularName = toSingular(name);
    const inputName = toInputName(name);

    const { kind } = model;

    switch (action) {
      case 'create':
        return `
          input ${mutationName}Input { data: ${inputName} }
          type ${mutationName}Payload { ${singularName}: ${model.globalId} }
        `;
      case 'update':
        if (kind === 'singleType') {
          return `
          input ${mutationName}Input  { data: edit${inputName} }
          type ${mutationName}Payload { ${singularName}: ${model.globalId} }
        `;
        }

        return `
          input ${mutationName}Input  { where: InputID, data: edit${inputName} }
          type ${mutationName}Payload { ${singularName}: ${model.globalId} }
        `;
      case 'delete':
        if (kind === 'singleType') {
          return `
          type ${mutationName}Payload { ${singularName}: ${model.globalId} }
        `;
        }

        return `
          input ${mutationName}Input  { where: InputID }
          type ${mutationName}Payload { ${singularName}: ${model.globalId} }
        `;
      default:
      // Nothing
    }
  },
};
