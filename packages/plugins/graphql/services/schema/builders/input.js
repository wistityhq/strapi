'use strict';

const { inputObjectType, nonNull } = require('nexus');

const { utils, mappers } = require('../../types');

module.exports = context => {
  const { strapi } = context;

  return {
    buildInputType(contentType) {
      const { attributes, modelType } = contentType;

      const name = (modelType === 'component'
        ? utils.getComponentInputName
        : utils.getContentTypeInputName
      ).call(null, contentType);

      return inputObjectType({
        name,

        definition(t) {
          for (const [attributeName, attribute] of Object.entries(attributes)) {
            // Scalars
            if (utils.isScalar(attribute)) {
              const gqlScalar = mappers.strapiScalarToGraphQLScalar(attribute.type);

              t.field(attributeName, { type: gqlScalar });
            }

            // Relations
            else if (utils.isRelation(attribute)) {
              t.id(attributeName);
            }

            // Enums
            else if (utils.isEnumeration(attribute)) {
              const enumTypeName = utils.getEnumName(contentType, attributeName);

              t.field(attributeName, { type: enumTypeName });
            }

            // Components
            else if (utils.isComponent(attribute)) {
              const component = strapi.components[attribute.component];
              const componentInputType = utils.getComponentInputName(component);

              if (attribute.repeatable) {
                t.list.field(attributeName, { type: componentInputType });
              } else {
                t.field(attributeName, { type: componentInputType });
              }
            }

            // Dynamic Zones
            else if (utils.isDynamicZone(attribute)) {
              const dzInputName = utils.getDynamicZoneInputName(contentType, attributeName);

              t.list.field(attributeName, { type: nonNull(dzInputName) });
            }
          }
        },
      });
    },
  };
};
