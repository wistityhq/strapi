'use strict';

const path = require('path');
const _ = require('lodash');
const pluralize = require('pluralize');

const { nameToSlug, nameToCollectionName } = require('@strapi/utils');
const { isRelation, isConfigurable } = require('../../utils/attributes');
const { typeKinds } = require('../constants');
const createSchemaHandler = require('./schema-handler');

module.exports = function createComponentBuilder() {
  return {
    setRelation({ key, uid, attribute }) {
      const targetCT = this.contentTypes.get(attribute.target);
      const targetAttribute = targetCT.getAttribute(attribute.targetAttribute);

      if (!attribute.targetAttribute) {
        return;
      }

      targetCT.setAttribute(
        attribute.targetAttribute,
        generateRelation({
          key,
          attribute,
          uid: uid,
          targetAttribute,
        })
      );
    },

    unsetRelation(attribute) {
      const targetCT = this.contentTypes.get(attribute.target);

      const targetAttributeName = attribute.inversedBy || attribute.mappedBy;
      const targetAttribute = targetCT.getAttribute(targetAttributeName);

      if (!targetAttribute) return;

      // TODO: do not delete polymorphic relations
      // if (false) {
      //   return;
      // }

      return targetCT.deleteAttribute(targetAttributeName);
    },

    /**
     * create a component in the tmpComponent map
     *
     * @param {object} infos content type info
     * @returns {object} new content type
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
          draftAndPublish: infos.draftAndPublish || false,
        })
        .set('pluginOptions', infos.pluginOptions)
        .setAttributes(this.convertAttributes(infos.attributes));

      Object.keys(infos.attributes).forEach(key => {
        const attribute = infos.attributes[key];

        if (isRelation(attribute)) {
          this.setRelation({
            key,
            uid,
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

        const targetAttributeName = attribute.inversedBy || attribute.mappedBy;

        // if the old relation has a target attribute. we need to remove it in the target type
        if (isConfigurable(attribute) && isRelation(attribute) && !_.isNil(targetAttributeName)) {
          this.unsetRelation(attribute);
        }
      });

      remainingKeys.forEach(key => {
        const oldAttribute = oldAttributes[key];
        const newAttribute = newAttributes[key];

        if (!isRelation(oldAttribute) && isRelation(newAttribute)) {
          return this.setRelation({
            key,
            uid,
            attribute: newAttributes[key],
          });
        }

        if (isRelation(oldAttribute) && !isRelation(newAttribute)) {
          return this.unsetRelation(oldAttribute);
        }

        if (isRelation(oldAttribute) && isRelation(newAttribute)) {
          const oldTargetAttributeName = oldAttribute.inversedBy || oldAttribute.mappedBy;

          if (
            !_.isNil(oldTargetAttributeName) &&
            oldTargetAttributeName !== newAttribute.targetAttribute
          ) {
            this.unsetRelation(oldAttribute);
          }

          // TODO: handle edition to keep the direction

          // keep extra options that were set manually on oldAttribute
          _.defaults(newAttribute, oldAttribute);

          return this.setRelation({
            key,
            uid,
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
            uid,
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
 *
 * @param {object} options options
 * @param {string} options.name component name
 * @returns {string} uid
 */
const createContentTypeUID = ({ name }) => `application::${nameToSlug(name)}.${nameToSlug(name)}`;

const generateRelation = ({ key, attribute, uid, targetAttribute = {} }) => {
  const opts = {
    type: 'relation',
    target: uid,
    autoPopulate: targetAttribute.autoPopulate,
    private: targetAttribute.private || undefined,
  };

  switch (attribute.relation) {
    case 'oneToOne': {
      opts.relation = 'oneToOne';
      opts.mappedBy = key;
      break;
    }
    case 'oneToMany': {
      opts.relation = 'manyToOne';
      opts.inversedBy = key;
      break;
    }
    case 'manyToOne': {
      opts.relation = 'oneToMany';
      opts.mappedBy = key;
      break;
    }
    case 'manyToMany': {
      opts.relation = 'manyToMany';
      opts.mappedBy = key;

      break;
    }
    default:
  }

  return opts;
};
