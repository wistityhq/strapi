'use strict';

const { createContentType } = require('../domain/content-type');

module.exports = (contentTypeDefinitions, { pluginName, apiName }) => {
  let contentTypes = contentTypeDefinitions.map(ct =>
    createContentType(ct, { pluginName, apiName })
  );

  const contentTypesMap = new Map();
  contentTypes.forEach(ct => contentTypesMap.set(ct.schema.info.singularName, ct));

  return {
    has(ctName) {
      return contentTypesMap.has(ctName);
    },
    get(ctName) {
      return contentTypesMap.get(ctName);
    },
    getAll() {
      return Array.from(contentTypesMap.values());
    },
    forEach(fn) {
      contentTypesMap.forEach(fn);
    },
    get size() {
      return contentTypesMap.size;
    },
  };
};
