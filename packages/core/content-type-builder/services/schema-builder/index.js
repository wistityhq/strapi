'use strict';

const path = require('path');
const _ = require('lodash');

const createSchemaHandler = require('./schema-handler');
const createComponentBuilder = require('./component-builder');
const createContentTypeBuilder = require('./content-type-builder');

/**
 * Creates a content type schema builder instance
 *
 * @returns {object} content type schema builder
 */
module.exports = function createBuilder() {
  const components = Object.keys(strapi.components).map(key => {
    const compo = strapi.components[key];

    return {
      category: compo.category,
      modelName: compo.modelName,
      plugin: compo.modelName,
      uid: compo.uid,
      filename: compo.__filename__,
      dir: path.join(strapi.dir, 'components', compo.category),
      schema: compo.__schema__,
    };
  });

  const contentTypes = Object.keys(strapi.contentTypes).map(key => {
    const contentType = strapi.contentTypes[key];

    let dir;
    if (contentType.plugin) {
      dir = `./extensions/${contentType.plugin}/models`;
    } else {
      dir = `./api/${contentType.apiName}/models`;
    }

    return {
      modelName: contentType.modelName,
      plugin: contentType.plugin,
      uid: contentType.uid,
      filename: `${contentType.info.singularName}.json`,
      dir: path.join(strapi.dir, dir),
      schema: contentType.__schema__,
    };
  });

  return createSchemaBuilder({
    components,
    contentTypes,
  });
};

/**
 * Schema builder
 *
 * @param {object} opts options
 * @param {object} opts.contentTypes contentTypes
 * @returns {object} schema builder
 */
function createSchemaBuilder({ components, contentTypes }) {
  const tmpComponents = new Map();
  const tmpContentTypes = new Map();

  // init temporary ContentTypes
  Object.keys(contentTypes).forEach(key => {
    tmpContentTypes.set(contentTypes[key].uid, createSchemaHandler(contentTypes[key]));
  });

  // init temporary components
  Object.keys(components).forEach(key => {
    tmpComponents.set(components[key].uid, createSchemaHandler(components[key]));
  });

  return {
    get components() {
      return tmpComponents;
    },
    get contentTypes() {
      return tmpContentTypes;
    },

    /**
     * Convert Attributes received from the API to the right syntaxt
     *
     * @param {object} attributes input attributes
     * @returns {object} transformed attributes
     */
    convertAttributes(attributes) {
      return Object.keys(attributes).reduce((acc, key) => {
        const attribute = attributes[key];

        const { configurable } = attribute;

        if (attribute.type === 'relation') {
          const { target, relation, targetAttribute, private: isPrivate } = attribute;

          const attr = {
            type: 'relation',
            relation,
            target,
            configurable: configurable === false ? false : undefined,
            private: isPrivate === true ? true : undefined,
          };

          if (!this.contentTypes.has(target)) {
            throw new Error(`target: ${target} does not exist`);
          }

          if (
            ['oneToOne', 'manyToOne', 'manyToMany'].includes(relation) &&
            !_.isNil(targetAttribute)
          ) {
            attr.inversedBy = targetAttribute;
          } else if (['oneToMany'].includes(relation) && !_.isNil(targetAttribute)) {
            attr.mappedBy = targetAttribute;
          }

          acc[key] = attr;
          return acc;
        }

        if (_.has(attribute, 'type')) {
          acc[key] = {
            ...attribute,
            configurable: configurable === false ? false : undefined,
          };

          return acc;
        }

        return acc;
      }, {});
    },

    ...createComponentBuilder({ tmpComponents, tmpContentTypes }),
    ...createContentTypeBuilder({ tmpComponents, tmpContentTypes }),

    /**
     * Write all type to files
     *
     * @returns {void}
     */
    async writeFiles() {
      return Promise.all(
        [...Array.from(tmpComponents.values()), ...Array.from(tmpContentTypes.values())].map(
          schema => {
            return schema.flush();
          }
        )
      )
        .catch(error => {
          strapi.log.error('Error writing schema files');
          strapi.log.error(error);
          return this.rollback();
        })
        .catch(error => {
          strapi.log.error(
            'Error rolling back schema files. You might need to fix your files manually'
          );
          strapi.log.error(error);

          throw new Error('Invalid schema edition');
        });
    },

    /**
     * rollback all files
     *
     * @returns {void}
     */
    rollback() {
      return Promise.all(
        [
          ...Array.from(tmpComponents.values()),
          ...Array.from(tmpContentTypes.values()),
        ].map(schema => schema.rollback())
      );
    },
  };
}
