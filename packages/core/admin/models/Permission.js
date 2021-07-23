'use strict';

/**
 * Lifecycle callbacks for the `Permission` model.
 */

module.exports = {
  collectionName: 'strapi_permissions',
  info: {
    name: 'Permission',
    description: '',
    singularName: 'permission',
    pluralName: 'permissions',
    displayName: 'Permission',
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
    action: {
      type: 'string',
      minLength: 1,
      configurable: false,
      required: true,
    },
    subject: {
      type: 'string',
      minLength: 1,
      configurable: false,
      required: false,
    },
    properties: {
      type: 'json',
      configurable: false,
      required: false,
      default: {},
    },
    conditions: {
      type: 'json',
      configurable: false,
      required: false,
      default: [],
    },
    role: {
      configurable: false,
      type: 'relation',
      relation: 'manyToOne',
      inversedBy: 'permissions',
      target: 'strapi::role',
    },
  },
};
