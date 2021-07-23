'use strict';

const CONTENT_TYPE = 'CONTENT_TYPE';
const COMPONENT = 'COMPONENT';

const SINGLE_TYPE = 'singleType';
const COLLECTION_TYPE = 'collectionType';

const DEFAULT_TYPES = [
  // advanced types
  'media',

  // scalar types
  'string',
  'text',
  'richtext',
  'json',
  'enumeration',
  'password',
  'email',
  'integer',
  'biginteger',
  'float',
  'decimal',
  'date',
  'time',
  'datetime',
  'timestamp',
  'boolean',

  'relation',
];

const VALID_UID_TARGETS = ['string', 'text'];

const FORBIDDEN_ATTRIBUTE_NAMES = ['__component', '__contentType'];

const PREFIX = 'strapi::';
const STRAPI_USER = 'strapi::user';
const UPLOAD_FILE = 'plugins::upload.file';

module.exports = {
  DEFAULT_TYPES,
  typeKinds: {
    SINGLE_TYPE,
    COLLECTION_TYPE,
  },
  modelTypes: {
    CONTENT_TYPE,
    COMPONENT,
  },
  FORBIDDEN_ATTRIBUTE_NAMES,
  VALID_UID_TARGETS,
  coreUids: {
    STRAPI_USER,
    PREFIX,
  },
  pluginsUids: {
    UPLOAD_FILE,
  },
};
