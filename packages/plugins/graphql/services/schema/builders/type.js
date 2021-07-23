'use strict';

const { isArray } = require('lodash/fp');
const { objectType } = require('nexus');

const { contentTypes } = require('@strapi/utils');

const { mappers, utils: typeUtils } = require('../../types');
const { buildAssocResolvers } = require('../../old/shadow-crud');

/**
 * @typedef TypeBuildersOptions
 *
 * @property {ObjectDefinitionBlock} builder
 * @property {string} attributeName
 * @property {object} attribute
 * @property {object} contentType
 * @property {object} context
 * @property {object} context.strapi
 * @property {object} context.registry
 */

module.exports = context => ({
  /**
   * Create a type definition for a given content type
   * @param contentType - The content type used to created the definition
   * @return {NexusObjectTypeDef}
   */
  buildTypeDefinition(contentType) {
    const { attributes, primaryKey, modelType, options = {} } = contentType;

    const attributesKey = Object.keys(attributes);
    const hasTimestamps = isArray(options.timestamps);

    const name = (modelType === 'component'
      ? typeUtils.getComponentName
      : typeUtils.getTypeName
    ).call(null, contentType);

    return objectType({
      name,

      definition(t) {
        // 1. ID & Primary key
        // Always add the ID as a required attribute
        // Also, add the primary key of the content type as a required ID attribute
        t.nonNull.id('id');
        t.nonNull.id(primaryKey);

        // 2. Timestamps
        // If the content type has timestamps enabled
        // then we should add the corresponding attributes in the definition
        if (hasTimestamps) {
          const [createdAtKey, updatedAtKey] = contentType.options.timestamps;

          t.nonNull.dateTime(createdAtKey);
          t.nonNull.dateTime(updatedAtKey);
        }

        /** 3. Attributes
         *
         * Attributes can be of 5 different kind:
         * - Scalar
         * - Component
         * - Dynamic Zone
         * - Enum
         * - Relation
         *
         * Here, we iterate over each non-private attribute
         * and add it to the type definition based on its type
         */
        attributesKey
          // Ignore private attributes
          .filter(isNotPrivate(contentType))
          // Add each attribute to the type definition
          .forEach(attributeName => {
            const attribute = attributes[attributeName];

            // We create a copy of the builder (t) to apply custom
            // rules only on the current attribute (eg: nonNull, list, ...)
            let builder = t;

            if (attribute.required) {
              builder = builder.nonNull;
            }

            /**
             * @type {TypeBuildersOptions}
             */
            const options = { builder, attributeName, attribute, contentType, context };

            // Scalars
            if (typeUtils.isScalar(attribute)) {
              addScalarAttribute(options);
            }

            // Components
            else if (typeUtils.isComponent(attribute)) {
              addComponentAttribute(options);
            }

            // Dynamic Zones
            else if (typeUtils.isDynamicZone(attribute) && attribute.components.length > 0) {
              addDynamicZoneAttribute(options);
            }

            // Enums
            else if (typeUtils.isEnumeration(attribute)) {
              addEnumAttribute(options);
            }

            // Relations
            else if (typeUtils.isRelation(attribute)) {
              addRelationalAttribute(options);
            }
          });
      },
    });
  },
});

/**
 * Add a scalar attribute to the type definition
 *
 * The attribute is added based on a simple association between a Strapi
 * type and a GraphQL type (the map is defined in `strapiTypeToGraphQLScalar`)
 *
 * @param {TypeBuildersOptions} options
 */
const addScalarAttribute = ({ builder, attributeName, attribute }) => {
  const gqlType = mappers.strapiScalarToGraphQLScalar(attribute.type);

  builder.field(attributeName, { type: gqlType });
};

/**
 * Add a component attribute to the type definition
 *
 * The attribute is added by fetching the component's type
 * name and using it as the attribute's type
 *
 * @param {TypeBuildersOptions} options
 */
const addComponentAttribute = ({ builder, attributeName, attribute }) => {
  const type = typeUtils.getComponentNameFromAttribute(attribute);

  if (attribute.repeatable) {
    builder = builder.list;
  }

  builder.field(attributeName, { type });
};

/**
 * Add a dynamic zone attribute to the type definition
 *
 * The attribute is added by fetching the dynamic zone's
 * type name and using it as the attribute's type
 *
 * @param {TypeBuildersOptions} options
 */
const addDynamicZoneAttribute = ({ builder, attributeName, contentType }) => {
  const type = typeUtils.getDynamicZoneName(contentType, attributeName);

  builder.field(attributeName, { type });
};

/**
 * Add an enum attribute to the type definition
 *
 * The attribute is added by fetching the enum's type
 * name and using it as the attribute's type
 *
 * @param {TypeBuildersOptions} options
 */
const addEnumAttribute = ({ builder, attributeName, contentType }) => {
  const type = typeUtils.getEnumName(contentType, attributeName);

  builder.field(attributeName, { type });
};

/**
 * Add a relational attribute to the type definition
 * @param {TypeBuildersOptions} options
 */
const addRelationalAttribute = options => {
  let { builder } = options;
  const {
    attributeName,
    attribute,
    contentType,
    context: { registry, strapi },
  } = options;

  const { associations = [] } = contentType;

  // Polymorphic relations
  if (typeUtils.isMorphRelation(attribute)) {
    const morphType = typeUtils.getMorphRelationTypeName(contentType, attributeName);

    if (registry.has(morphType)) {
      builder.field(attributeName, {
        type: morphType,
        resolve: buildAssocResolvers(contentType)[attributeName],
      });
    }

    return;
  }

  const rel = strapi.getModel(attribute.model || attribute.collection, attribute.plugin);

  const relationType = associations.find(assoc => assoc.alias === attributeName).nature;
  const type = typeUtils.getTypeName(rel);

  // todo[v4]: directly map collection relations somewhere else
  if (relationType.endsWith('Many')) {
    builder = builder.list;
  }

  builder.field(attributeName, {
    type,
    resolve: buildAssocResolvers(contentType)[attributeName],
    // todo: use new assoc resolver for relations
    // resolve: buildAssociationResolver(contentType.uid, attributeName),
  });
};

/**
 * Bind a content type on an attribute privacy checker
 *
 * @param {object} contentType
 * @return {function(string): boolean}
 */
const isNotPrivate = contentType => attributeName => {
  return !contentTypes.isPrivateAttribute(contentType, attributeName);
};
