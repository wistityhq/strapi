'use strict';

/**
 * Lifecycle callbacks for the `File` model.
 */

module.exports = {
  collectionName: 'files',
  info: {
    singularName: 'file',
    pluralName: 'files',
    displayName: 'File',
    description: '',
  },
  options: {},
  pluginOptions: {
    'content-manager': {
      visible: false,
    },
    'content-type-builder': {
      visible: false,
    },
  },
  attributes: {
    name: {
      type: 'string',
      configurable: false,
      required: true,
    },
    alternativeText: {
      type: 'string',
      configurable: false,
    },
    caption: {
      type: 'string',
      configurable: false,
    },
    width: {
      type: 'integer',
      configurable: false,
    },
    height: {
      type: 'integer',
      configurable: false,
    },
    formats: {
      type: 'json',
      configurable: false,
    },
    hash: {
      type: 'string',
      configurable: false,
      required: true,
    },
    ext: {
      type: 'string',
      configurable: false,
    },
    mime: {
      type: 'string',
      configurable: false,
      required: true,
    },
    size: {
      type: 'decimal',
      configurable: false,
      required: true,
    },
    url: {
      type: 'string',
      configurable: false,
      required: true,
    },
    previewUrl: {
      type: 'string',
      configurable: false,
    },
    provider: {
      type: 'string',
      configurable: false,
      required: true,
    },
    provider_metadata: {
      type: 'json',
      configurable: false,
    },
    // related: {
    //   collection: '*',
    //   filter: 'field',
    //   configurable: false,
    // },
  },
};
