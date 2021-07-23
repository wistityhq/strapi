'use strict';

const { contentTypes: contentTypesUtils } = require('@strapi/utils');

const {
  PUBLISHED_AT_ATTRIBUTE,
  CREATED_BY_ATTRIBUTE,
  UPDATED_BY_ATTRIBUTE,
} = contentTypesUtils.constants;

// contentTypes and components reserved names
const RESERVED_MODEL_NAMES = ['admin', 'boolean', 'date', 'date-time', 'time', 'upload'];
// attribute reserved names
const RESERVED_ATTRIBUTE_NAMES = [
  // existing fields
  '_id',
  'id',
  CREATED_BY_ATTRIBUTE,
  UPDATED_BY_ATTRIBUTE,
  PUBLISHED_AT_ATTRIBUTE,

  // existing object properties that may cause trouble
  'length',
  'attributes',
  'relations',
  'changed',

  // list found here https://mongoosejs.com/docs/api.html#schema_Schema.reserved
  '_posts',
  '_pres',
  'collection',
  'emit',
  'errors',
  'get',
  'init',
  'isModified',
  'isNew',
  'listeners',
  'modelName',
  'on',
  'once',
  'populated',
  'prototype',
  'remove',
  'removeListener',
  'save',
  'schema',
  'toObject',
  'validate',
  'format',
];

module.exports = {
  RESERVED_MODEL_NAMES,
  RESERVED_ATTRIBUTE_NAMES,
};
