'use strict';

const path = require('path');
const _ = require('lodash');

const createSchemaHandler = require('./schema-handler');
const createComponentBuilder = require('./component-builder');
const createContentTypeBuilder = require('./content-type-builder');

const MODEL_RELATIONS = ['oneWay', 'oneToOne', 'manyToOne'];
const COLLECTION_RELATIONS = ['manyWay', 'manyToMany', 'oneToMany'];

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
      filename: contentType.__filename__,
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

    convertAttributes(attributes) {
      return Object.keys(attributes).reduce((acc, key) => {
        const attribute = attributes[key];

        const { configurable } = attribute;

        if (_.has(attribute, 'type')) {
          if (attribute.type === 'media') {
            const fileModel = strapi.getModel('file', 'upload');
            if (!fileModel) return acc;

            const via = _.findKey(fileModel.attributes, { collection: '*' });
            acc[key] = {
              [attribute.multiple ? 'collection' : 'model']: 'file',
              via,
              allowedTypes: attribute.allowedTypes,
              plugin: 'upload',
              required: !!attribute.required,
              configurable: configurable === false ? false : undefined,
              pluginOptions: attribute.pluginOptions || {},
            };
          } else {
            acc[key] = {
              ...attribute,
              configurable: configurable === false ? false : undefined,
            };
          }

          return acc;
        }

        if (_.has(attribute, 'target')) {
          const {
            target,
            nature,
            unique,
            targetAttribute,
            columnName,
            dominant,
            private: isPrivate,
            ...restOfOptions
          } = attribute;

          const attr = {
            unique: unique === true ? true : undefined,
            columnName: columnName || undefined,
            configurable: configurable === false ? false : undefined,
            private: isPrivate === true ? true : undefined,
            ...restOfOptions,
          };

          if (!this.contentTypes.has(target)) {
            throw new Error(`target: ${target} does not exist`);
          }

          const { modelName, plugin } = this.contentTypes.get(target);

          attr.plugin = plugin;

          if (MODEL_RELATIONS.includes(nature)) {
            attr.model = modelName;
          } else if (COLLECTION_RELATIONS.includes(nature)) {
            attr.collection = modelName;
          }

          if (!['manyWay', 'oneWay'].includes(nature)) {
            attr.via = targetAttribute;
            attr.dominant = dominant || undefined;
          }

          acc[key] = attr;
        }

        return acc;
      }, {});
    },

    ...createComponentBuilder({ tmpComponents, tmpContentTypes }),
    ...createContentTypeBuilder({ tmpComponents, tmpContentTypes }),

    /**
     * Write all type to files
     */
    writeFiles() {
      return Promise.all(
        [
          ...Array.from(tmpComponents.values()),
          ...Array.from(tmpContentTypes.values()),
        ].map(schema => schema.flush())
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
