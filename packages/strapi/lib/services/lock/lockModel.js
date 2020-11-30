'use strict';

const lockModel = config => ({
  connection: config.get('database.defaultConnection'),
  uid: 'strapi::locks',
  internal: true,
  globalId: 'StrapiLocks',
  collectionName: 'strapi_locks',
  info: {
    name: 'Strapi locks',
    description: '',
  },
  options: {
    timestamps: true,
  },
  attributes: {
    uid: {
      type: 'string',
      required: true,
      unique: true,
      index: true,
    },
    key: {
      type: 'string',
      required: true,
      unique: true,
      index: true,
    },
    metadata: {
      type: 'json',
      required: true,
    },
    expiresAt: {
      type: 'timestamp',
    },
  },
});

module.exports = lockModel;
