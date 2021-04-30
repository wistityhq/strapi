'use strict';

const path = require('path');
const _ = require('lodash');
const pluralize = require('pluralize');

const { nameToSlug, nameToCollectionName } = require('strapi-utils');
const { isRelation, toUID, isConfigurable } = require('../../utils/attributes');
const { typeKinds } = require('../constants');
const createSchemaHandler = require('./schema-handler');

module.exports = function createComponentBuilder() {
  return {
    setRelation({ key, modelName, plugin, attribute }) {
      const targetCT = this.contentTypes.get(attribute.target);
      const targetAttribute = targetCT.getAttribute(attribute.targetAttribute);
      targetCT.setAttribute(
        attribute.targetAttribute,
        generateRelation({
          key,
          attribute,
          plugin,
          modelName,
          targetAttribute,
        })
      );
    },

    unsetRelation(attribute) {
      const target = attribute.model || attribute.collection;
      const plugin = attribute.plugin;

      const uid = toUID(target, plugin);

      const targetCT = this.contentTypes.get(uid);
      const targetAttribute = targetCT.getAttribute(attribute.via);

      if (!targetAttribute) return;

      // do not delete polymorphic relations
      if (targetAttribute.collection === '*' || targetAttribute.model === '*') {
        return;
      }

      return targetCT.deleteAttribute(attribute.via);
    },

    /**
     * create a component in the tmpComponent map
     */
    createContentType(infos) {
      const uid = createContentTypeUID(infos);

      if (this.contentTypes.has(uid)) {
        throw new Error('contentType.alreadyExists');
      }

      const contentType = createSchemaHandler({
        modelName: nameToSlug(infos.name),
        dir: path.join(strapi.dir, 'api', nameToSlug(infos.name), 'models'),
        filename: `${nameToSlug(infos.name)}.settings.json`,
      });

      this.contentTypes.set(uid, contentType);

      const defaultCollectionName = `${nameToCollectionName(pluralize(infos.name))}`;

      // support self referencing content type relation
      Object.keys(infos.attributes).forEach(key => {
        const { target } = infos.attributes[key];
        if (target === '__self__') {
          infos.attributes[key].target = uid;
        }
      });

      contentType
        .setUID(uid)
        .set('kind', infos.kind || typeKinds.COLLECTION_TYPE)
        .set('collectionName', infos.collectionName || defaultCollectionName)
        .set('info', {
          name: infos.name,
          description: infos.description,
        })
        .set('options', {
          increments: true,
          timestamps: true,
          draftAndPublish: infos.draftAndPublish || false,
        })
        .set('pluginOptions', infos.pluginOptions)
        .setAttributes(this.convertAttributes(infos.attributes));

      Object.keys(infos.attributes).forEach(key => {
        const attribute = infos.attributes[key];

        if (isRelation(attribute)) {
          this.setRelation({
            key,
            modelName: contentType.modelName,
            plugin: contentType.plugin,
            attribute,
          });
        }
      });

      return contentType;
    },

    editContentType(infos) {
      const { uid } = infos;

      if (!this.contentTypes.has(uid)) {
        throw new Error('contentType.notFound');
      }

      const contentType = this.contentTypes.get(uid);

      const oldAttributes = contentType.schema.attributes;

      const newAttributes = _.omitBy(infos.attributes, (attr, key) => {
        return _.has(oldAttributes, key) && !isConfigurable(oldAttributes[key]);
      });

      const newKeys = _.difference(Object.keys(newAttributes), Object.keys(oldAttributes));

      const deletedKeys = _.difference(Object.keys(oldAttributes), Object.keys(newAttributes));

      const remainingKeys = _.intersection(Object.keys(oldAttributes), Object.keys(newAttributes));

      // remove old relations
      deletedKeys.forEach(key => {
        const attribute = oldAttributes[key];

        // if the old relation has a target attribute. we need to remove it
        if (isConfigurable(attribute) && isRelation(attribute) && _.has(attribute, 'via')) {
          this.unsetRelation(attribute);
        }
      });

      remainingKeys.forEach(key => {
        const oldAttribute = oldAttributes[key];
        const newAttribute = newAttributes[key];

        if (!isRelation(oldAttribute) && isRelation(newAttribute)) {
          return this.setRelation({
            key,
            modelName: contentType.modelName,
            plugin: contentType.plugin,
            attribute: newAttributes[key],
          });
        }

        if (isRelation(oldAttribute) && !isRelation(newAttribute)) {
          return this.unsetRelation(oldAttribute);
        }

        if (isRelation(oldAttribute) && isRelation(newAttribute)) {
          if (_.has(oldAttribute, 'via') && oldAttribute.via !== newAttribute.targetAttribute) {
            this.unsetRelation(oldAttribute);
          }

          // keep extra options that were set manually on oldAttribute
          _.defaults(newAttribute, oldAttribute);

          return this.setRelation({
            key,
            modelName: contentType.modelName,
            plugin: contentType.plugin,
            attribute: newAttribute,
          });
        }
      });

      // add new relations
      newKeys.forEach(key => {
        const attribute = newAttributes[key];

        if (isRelation(attribute)) {
          this.setRelation({
            key,
            modelName: contentType.modelName,
            plugin: contentType.plugin,
            attribute,
          });
        }
      });

      contentType
        .set('collectionName', infos.collectionName)
        .set('kind', infos.kind || contentType.schema.kind)
        .set(['info', 'name'], infos.name)
        .set(['info', 'description'], infos.description)
        .set(['options', 'draftAndPublish'], infos.draftAndPublish || false)
        .set('pluginOptions', infos.pluginOptions)
        .setAttributes(this.convertAttributes(newAttributes));

      return contentType;
    },

    deleteContentType(uid) {
      if (!this.contentTypes.has(uid)) {
        throw new Error('contentType.notFound');
      }

      this.components.forEach(compo => {
        compo.removeContentType(uid);
      });

      this.contentTypes.forEach(ct => {
        ct.removeContentType(uid);
      });

      return this.contentTypes.get(uid).delete();
    },
  };
};

/**
 * Returns a uid from a content type infos
 * @param {Object} options options
 * @param {string} options.name component name
 */
const createContentTypeUID = ({ name }) => `application::${nameToSlug(name)}.${nameToSlug(name)}`;

const generateRelation = ({ key, attribute, plugin, modelName, targetAttribute = {} }) => {
  const opts = {
    via: key,
    plugin,
    columnName: attribute.targetColumnName || undefined,
    autoPopulate: targetAttribute.autoPopulate,
    private: targetAttribute.private || undefined,
  };

  switch (attribute.nature) {
    case 'manyWay':
    case 'oneWay':
      return;
    case 'oneToOne':
    case 'oneToMany':
      opts.model = modelName;
      break;
    case 'manyToOne':
      opts.collection = modelName;
      break;
    case 'manyToMany': {
      opts.collection = modelName;

      if (!attribute.dominant) {
        opts.dominant = true;
      }
      break;
    }
    default:
  }

  return opts;
};
