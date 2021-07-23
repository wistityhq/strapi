'use strict';

/**
 * Export shared utilities
 */
const { buildQuery, hasDeepFilters } = require('./build-query');
const {
  convertRestQueryParams,
  VALID_REST_OPERATORS,
  QUERY_OPERATORS,
} = require('./convert-rest-query-params');
const parseMultipartData = require('./parse-multipart');
const sanitizeEntity = require('./sanitize-entity');
const parseType = require('./parse-type');
const finder = require('./finder');
const policy = require('./policy');
const templateConfiguration = require('./template-configuration');
const { yup, formatYupErrors } = require('./validators');
const {
  nameToSlug,
  nameToCollectionName,
  getCommonBeginning,
  escapeQuery,
  stringIncludes,
  stringEquals,
} = require('./string-formatting');
const { removeUndefined } = require('./object-formatting');
const { getConfigUrls, getAbsoluteAdminUrl, getAbsoluteServerUrl } = require('./config');
const { generateTimestampCode } = require('./code-generator');
const contentTypes = require('./content-types');
const webhook = require('./webhook');
const env = require('./env-helper');
const relations = require('./relations');
const setCreatorFields = require('./set-creator-fields');
const hooks = require('./hooks');
const providerFactory = require('./provider-factory');

module.exports = {
  yup,
  formatYupErrors,
  finder,
  policy,
  templateConfiguration,
  convertRestQueryParams,
  VALID_REST_OPERATORS,
  QUERY_OPERATORS,
  buildQuery,
  hasDeepFilters,
  parseMultipartData,
  sanitizeEntity,
  parseType,
  nameToSlug,
  nameToCollectionName,
  getCommonBeginning,
  getConfigUrls,
  escapeQuery,
  removeUndefined,
  getAbsoluteAdminUrl,
  getAbsoluteServerUrl,
  generateTimestampCode,
  stringIncludes,
  stringEquals,
  contentTypes,
  webhook,
  env,
  relations,
  setCreatorFields,
  hooks,
  providerFactory,
};
