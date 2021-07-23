'use strict';

const { prop } = require('lodash/fp');
const { yup, formatYupErrors } = require('@strapi/utils');
const { isoLocales } = require('../constants');

const allowedLocaleCodes = isoLocales.map(prop('code'));

const handleReject = error => Promise.reject(formatYupErrors(error));

const createLocaleSchema = yup
  .object()
  .shape({
    name: yup
      .string()
      .max(50)
      .nullable(),
    code: yup
      .string()
      .oneOf(allowedLocaleCodes)
      .required(),
    isDefault: yup.boolean().required(),
  })
  .noUnknown();

const validateCreateLocaleInput = data => {
  return createLocaleSchema.validate(data, { strict: true, abortEarly: false }).catch(handleReject);
};

const updateLocaleSchema = yup
  .object()
  .shape({
    name: yup
      .string()
      .min(1)
      .max(50)
      .nullable(),
    isDefault: yup.boolean(),
  })
  .noUnknown();

const validateUpdateLocaleInput = data => {
  return updateLocaleSchema.validate(data, { strict: true, abortEarly: false }).catch(handleReject);
};

module.exports = {
  validateCreateLocaleInput,
  validateUpdateLocaleInput,
};
