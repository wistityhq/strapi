'use strict';

const PAGINATION_TYPE_NAME = 'Pagination';
const PUBLICATION_STATE_TYPE_NAME = 'PublicationState';

const RESPONSE_COLLECTION_META_TYPE_NAME = 'ResponseCollectionMeta';

const GRAPHQL_SCALARS = [
  'ID',
  'Boolean',
  'Int',
  'String',
  'Long',
  'Float',
  'JSON',
  'Date',
  'Time',
  'DateTime',
];

const STRAPI_SCALARS = [
  'boolean',
  'integer',
  'string',
  'biginteger',
  'float',
  'decimal',
  'json',
  'date',
  'time',
  'datetime',
  'timestamp',
];

module.exports = {
  PAGINATION_TYPE_NAME,
  RESPONSE_COLLECTION_META_TYPE_NAME,
  PUBLICATION_STATE_TYPE_NAME,
  GRAPHQL_SCALARS,
  STRAPI_SCALARS,
};
