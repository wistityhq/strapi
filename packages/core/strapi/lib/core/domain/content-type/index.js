'use strict';

const { cloneDeep } = require('lodash/fp');
const _ = require('lodash');
const { validateContentTypeDefinition } = require('./validator');

const createContentType = (definition, { apiName, pluginName } = {}) => {
  try {
    validateContentTypeDefinition(definition);
  } catch (e) {
    throw new Error(
      `
Content Type Definition is invalid in ${apiName || pluginName || 'the core'}.
${e.errors}
    `.trim()
    );
  }

  const createdContentType = cloneDeep(definition);

  if (apiName) {
    Object.assign(createdContentType.schema, {
      uid: `application::${apiName}.${definition.schema.info.singularName}`,
      apiName,
      collectionName: definition.schema.collectionName || definition.schema.info.singularName,
      globalId: getGlobalId(definition.schema, definition.schema.info.singularName),
    });
  } else if (pluginName) {
    Object.assign(createdContentType.schema, {
      uid: `plugins::${pluginName}.${definition.schema.info.singularName}`,
      plugin: pluginName,
      collectionName:
        createdContentType.schema.collectionName ||
        `${pluginName}_${definition.schema.info.singularName}`.toLowerCase(),
      globalId: getGlobalId(definition.schema, definition.schema.info.singularName, pluginName),
    });
  } else {
    Object.assign(createdContentType.schema, {
      uid: `strapi::${definition.schema.info.singularName}`,
      plugin: 'admin',
      globalId: getGlobalId(definition.schema, definition.schema.info.singularName, 'admin'),
    });
  }

  Object.assign(createdContentType.schema, {
    kind: createdContentType.schema.kind || 'collectionType',
    __schema__: pickSchema(definition.schema),
    modelType: 'contentType',
    modelName: definition.schema.info.singularName,
    connection: 'default',
  });
  Object.defineProperty(createdContentType.schema, 'privateAttributes', {
    get() {
      return strapi.getModel(createdContentType.schema.uid).privateAttributes;
    },
  });

  return createdContentType;
};

const getGlobalId = (model, modelName, prefix) => {
  let globalId = prefix ? `${prefix}-${modelName}` : modelName;

  return model.globalId || _.upperFirst(_.camelCase(globalId));
};

const pickSchema = model => {
  const schema = _.cloneDeep(
    _.pick(model, [
      'connection',
      'collectionName',
      'info',
      'options',
      'pluginOptions',
      'attributes',
    ])
  );

  schema.kind = model.kind || 'collectionType';
  return schema;
};

module.exports = {
  createContentType,
};
