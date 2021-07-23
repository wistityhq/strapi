'use strict';

const _ = require('lodash');
const yup = require('yup');
const { formatYupErrors, nameToSlug } = require('@strapi/utils');
const pluralize = require('pluralize');

const { getService } = require('../../utils');
const { modelTypes, DEFAULT_TYPES, typeKinds } = require('../../services/constants');
const createSchema = require('./model-schema');
const { removeEmptyDefaults, removeDeletedUIDTargetFields } = require('./data-transform');
const { nestedComponentSchema } = require('./component');

/**
 * Allowed relation per type kind
 */
const VALID_RELATIONS = {
  [typeKinds.SINGLE_TYPE]: ['oneToOne', 'oneToMany'],
  [typeKinds.COLLECTION_TYPE]: ['oneToOne', 'oneToMany', 'manyToOne', 'manyToMany'],
};

/**
 * Allowed types
 */
const VALID_TYPES = [...DEFAULT_TYPES, 'uid', 'component', 'dynamiczone'];

/**
 * Returns a yup schema to validate a content type payload
 * @param {Object} data payload
 */
const createContentTypeSchema = (data, { isEdition = false } = {}) => {
  const kind = _.get(data, 'contentType.kind', typeKinds.COLLECTION_TYPE);

  const contentTypeSchema = createSchema(VALID_TYPES, VALID_RELATIONS[kind] || [], {
    modelType: modelTypes.CONTENT_TYPE,
  }).shape({
    name: yup
      .string()
      .test(hasPluralName)
      .test(alreadyUsedContentTypeName(isEdition))
      .test(forbiddenContentTypeNameValidator())
      .min(1)
      .required(),
  });

  return yup
    .object({
      contentType: contentTypeSchema.required().noUnknown(),
      components: nestedComponentSchema,
    })
    .noUnknown();
};

/**
 * Validator for content type creation
 */
const validateContentTypeInput = data => {
  return createContentTypeSchema(data)
    .validate(data, {
      strict: true,
      abortEarly: false,
    })
    .catch(error => Promise.reject(formatYupErrors(error)));
};

/**
 * Validator for content type edition
 */
const validateUpdateContentTypeInput = data => {
  if (_.has(data, 'contentType')) {
    removeEmptyDefaults(data.contentType);
  }

  if (_.has(data, 'components') && Array.isArray(data.components)) {
    data.components.forEach(data => {
      if (_.has(data, 'uid')) {
        removeEmptyDefaults(data);
      }
    });
  }

  removeDeletedUIDTargetFields(data.contentType);

  return createContentTypeSchema(data, { isEdition: true })
    .validate(data, {
      strict: true,
      abortEarly: false,
    })
    .catch(error => Promise.reject(formatYupErrors(error)));
};

const forbiddenContentTypeNameValidator = () => {
  const reservedNames = getService('builder').getReservedNames().models;

  return {
    name: 'forbiddenContentTypeName',
    message: `Content Type name cannot be one of ${reservedNames.join(', ')}`,
    test: value => {
      if (reservedNames.includes(nameToSlug(value))) {
        return false;
      }

      return true;
    },
  };
};

const hasPluralName = {
  name: 'hasPluralName',
  message:
    'Content Type name `${value}` cannot be pluralized. \nSuggestion: add Item after the name (e.g News -> NewsItem).',
  test: value => {
    if (pluralize.singular(value) === pluralize(value)) {
      return false;
    }

    return true;
  },
};

const alreadyUsedContentTypeName = isEdition => {
  const usedNames = Object.values(strapi.contentTypes).map(ct => ct.modelName);

  return {
    name: 'nameAlreadyUsed',
    message: 'Content Type name `${value}` is already being used.',
    test: value => {
      // don't check on edition
      if (isEdition) return true;

      if (usedNames.includes(nameToSlug(value))) {
        return false;
      }
      return true;
    },
  };
};

/**
 * Validates type kind
 */
const validateKind = kind => {
  return yup
    .string()
    .oneOf([typeKinds.SINGLE_TYPE, typeKinds.COLLECTION_TYPE])
    .validate(kind)
    .catch(error => Promise.reject(formatYupErrors(error)));
};

module.exports = {
  validateContentTypeInput,
  validateUpdateContentTypeInput,
  validateKind,
};
