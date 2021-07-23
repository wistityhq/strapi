'use strict';

const _ = require('lodash');
const { getOr } = require('lodash/fp');
const pluralize = require('pluralize');
const generator = require('@strapi/generate');

const { nameToSlug, contentTypes: contentTypesUtils } = require('@strapi/utils');
const { formatAttributes, replaceTemporaryUIDs } = require('../utils/attributes');
const createBuilder = require('./schema-builder');
const apiHandler = require('./api-handler');
const { coreUids, pluginsUids } = require('./constants');

const isContentTypeVisible = model =>
  getOr(true, 'pluginOptions.content-type-builder.visible', model) === true;

const getRestrictRelationsTo = (contentType = {}) => {
  const { uid } = contentType;
  if (uid === coreUids.STRAPI_USER) {
    // TODO: replace with an obj { relation: 'x', bidirectional: true|false }
    return ['oneWay', 'manyWay'];
  }

  if (uid.startsWith(coreUids.PREFIX) || uid === pluginsUids.UPLOAD_FILE) {
    return [];
  }

  return null;
};

const getformattedName = (contentType = {}) => {
  const { uid, info } = contentType;
  const name = _.get(info, 'name') || _.upperFirst(pluralize(uid));

  return name;
};

/**
 * Format a contentType info to be used by the front-end
 * @param {Object} contentType
 */
const formatContentType = contentType => {
  const { uid, kind, modelName, plugin, connection, collectionName, info, options } = contentType;

  return {
    uid,
    plugin,
    apiID: modelName,
    schema: {
      name: getformattedName(contentType),
      description: _.get(info, 'description', ''),
      draftAndPublish: contentTypesUtils.hasDraftAndPublish({ options }),
      pluginOptions: contentType.pluginOptions,
      connection,
      kind: kind || 'collectionType',
      collectionName,
      attributes: formatAttributes(contentType),
      visible: isContentTypeVisible(contentType),
      restrictRelationsTo: getRestrictRelationsTo(contentType),
    },
  };
};

const createContentTypes = async contentTypes => {
  const builder = createBuilder();
  const createdContentTypes = [];

  for (const contentType of contentTypes) {
    createdContentTypes.push(await createContentType(contentType, { defaultBuilder: builder }));
  }

  await builder.writeFiles();

  return createdContentTypes;
};

/**
 * Creates a content type and handle the nested components sent with it
 * @param {Object} params params object
 * @param {Object} params.contentType Main component to create
 * @param {Array<Object>} params.components List of nested components to created or edit
 * @param {Object} options
 * @param {Builder} options.defaultBuilder
 */
const createContentType = async ({ contentType, components = [] }, options = {}) => {
  const builder = options.defaultBuilder || createBuilder();
  const uidMap = builder.createNewComponentUIDMap(components);

  const replaceTmpUIDs = replaceTemporaryUIDs(uidMap);

  const newContentType = builder.createContentType(replaceTmpUIDs(contentType));

  // allow components to target the new contentType
  const targetContentType = infos => {
    Object.keys(infos.attributes).forEach(key => {
      const { target } = infos.attributes[key];
      if (target === '__contentType__') {
        infos.attributes[key].target = newContentType.uid;
      }
    });

    return infos;
  };

  components.forEach(component => {
    const options = replaceTmpUIDs(targetContentType(component));

    if (!_.has(component, 'uid')) {
      return builder.createComponent(options);
    }

    return builder.editComponent(options);
  });

  // generate api skeleton
  await generateAPI({
    name: contentType.name,
    kind: contentType.kind,
  });

  if (!options.defaultBuilder) {
    await builder.writeFiles();
  }

  return newContentType;
};

/**
 * Generate an API squeleton
 * @param {string} name
 */
const generateAPI = ({ name, kind = 'collectionType' }) => {
  return new Promise((resolve, reject) => {
    const scope = {
      generatorType: 'api',
      id: nameToSlug(name),
      name: nameToSlug(name),
      rootPath: strapi.dir,
      args: {
        attributes: {},
        kind,
      },
    };

    generator(scope, {
      success: () => resolve(),
      error: err => reject(err),
    });
  });
};

/**
 * Edits a contentType and handle the nested contentTypes sent with it
 * @param {String} uid Content-type's uid
 * @param {Object} params params object
 * @param {Object} params.contentType Main contentType to create
 * @param {Array<Object>} params.components List of nested components to created or edit
 */
const editContentType = async (uid, { contentType, components = [] }) => {
  const builder = createBuilder();

  const previousKind = builder.contentTypes.get(uid).schema.kind;
  const newKind = contentType.kind || previousKind;

  if (newKind !== previousKind && newKind === 'singleType') {
    const entryCount = await strapi.query(uid).count();
    if (entryCount > 1) {
      throw strapi.errors.badRequest(
        'You cannot convert a collectionType to a singleType when having multiple entries in DB'
      );
    }
  }

  const uidMap = builder.createNewComponentUIDMap(components);
  const replaceTmpUIDs = replaceTemporaryUIDs(uidMap);

  const updatedContentType = builder.editContentType({
    uid,
    ...replaceTmpUIDs(contentType),
  });

  components.forEach(component => {
    if (!_.has(component, 'uid')) {
      return builder.createComponent(replaceTmpUIDs(component));
    }

    return builder.editComponent(replaceTmpUIDs(component));
  });

  if (newKind !== previousKind) {
    await apiHandler.backup(uid);

    try {
      await apiHandler.clear(uid);

      // generate new api skeleton
      await generateAPI({
        name: updatedContentType.schema.info.name,
        kind: updatedContentType.schema.kind,
      });

      await builder.writeFiles();
    } catch (error) {
      strapi.log.error(error);
      await apiHandler.rollback(uid);
    }

    return updatedContentType;
  }

  await builder.writeFiles();
  return updatedContentType;
};

const deleteContentTypes = async uids => {
  const builder = createBuilder();

  for (const uid of uids) {
    await deleteContentType(uid, builder);
  }

  await builder.writeFiles();
  for (const uid of uids) {
    try {
      await apiHandler.clear(uid);
    } catch (error) {
      strapi.log.error(error);
      await apiHandler.rollback(uid);
    }
  }
};

/**
 * Deletes a content type and the api files related to it
 * @param {string} uid content type uid
 * @param defaultBuilder
 */
const deleteContentType = async (uid, defaultBuilder = undefined) => {
  const builder = defaultBuilder || createBuilder();
  // make a backup
  await apiHandler.backup(uid);

  const contentType = builder.deleteContentType(uid);

  if (!defaultBuilder) {
    try {
      await builder.writeFiles();
      await apiHandler.clear(uid);
    } catch (error) {
      await apiHandler.rollback(uid);
    }
  }

  return contentType;
};

module.exports = () => ({
  createContentType,
  editContentType,
  deleteContentType,
  formatContentType,
  createContentTypes,
  deleteContentTypes,
});
