'use strict';

const _ = require('lodash');
const { yup, formatYupErrors } = require('strapi-utils');

const createModelConfigurationSchema = require('./model-configuration');

const TYPES = ['singleType', 'collectionType'];

const handleError = error => {
  throw strapi.errors.badRequest('ValidationError', formatYupErrors(error));
};

/**
 * Validates type kind
 */
const validateKind = kind => {
  return yup
    .string()
    .oneOf(TYPES)
    .nullable()
    .validate(kind)
    .catch(handleError);
};

const validateBulkDeleteInput = (data = {}) => {
  return yup
    .object({
      ids: yup
        .array()
        .of(yup.strapiID())
        .min(1)
        .required(),
    })
    .required()
    .validate(data, {
      strict: true,
      abortEarly: false,
    })
    .catch(handleError);
};

const validateGenerateUIDInput = data => {
  return yup
    .object({
      contentTypeUID: yup.string().required(),
      field: yup.string().required(),
      data: yup.object().required(),
    })
    .validate(data, {
      strict: true,
      abortEarly: false,
    })
    .catch(handleError);
};

const validateCheckUIDAvailabilityInput = data => {
  return yup
    .object({
      contentTypeUID: yup.string().required(),
      field: yup.string().required(),
      value: yup
        .string()
        .matches(new RegExp('^[A-Za-z0-9-_.~]*$'))
        .required(),
    })
    .validate(data, {
      strict: true,
      abortEarly: false,
    })
    .catch(handleError);
};

const validateUIDField = (contentTypeUID, field) => {
  const model = strapi.contentTypes[contentTypeUID];

  if (!model) {
    throw strapi.errors.badRequest('ValidationError', ['ContentType not found']);
  }

  if (
    !_.has(model, ['attributes', field]) ||
    _.get(model, ['attributes', field, 'type']) !== 'uid'
  ) {
    throw strapi.errors.badRequest('ValidationError', {
      field: ['field must be a valid `uid` attribute'],
    });
  }
};

const validateLockInputSchema = yup
  .object()
  .shape({
    metadata: yup.object().shape({
      lastActivityDate: yup.date(),
    }),
    force: yup.boolean(),
  })
  .noUnknown();

const validateLockInput = data => {
  return validateLockInputSchema
    .validate(data, { strict: true, abortEarly: false })
    .catch(handleError);
};

const validateExtendLockInputSchema = yup
  .object()
  .shape({
    uid: yup.string().required(),
    metadata: yup.object().shape({
      lastActivityDate: yup.date(),
    }),
  })
  .noUnknown();

const validateExtendLockInput = data => {
  return validateExtendLockInputSchema
    .validate(data, { strict: true, abortEarly: false })
    .catch(handleError);
};

const validateUnlockInputSchema = yup
  .object()
  .shape({
    uid: yup.string().required(),
  })
  .noUnknown();

const validateUnlockInput = data => {
  return validateUnlockInputSchema
    .validate(data, { strict: true, abortEarly: false })
    .catch(handleError);
};

module.exports = {
  createModelConfigurationSchema,
  validateKind,
  validateBulkDeleteInput,
  validateGenerateUIDInput,
  validateCheckUIDAvailabilityInput,
  validateUIDField,
  validateLockInput,
  validateExtendLockInput,
  validateUnlockInput,
};
