'use strict';

const { yup, formatYupErrors } = require('@strapi/utils');
const { get } = require('lodash/fp');

const handleReject = error => Promise.reject(formatYupErrors(error));

const validateGetNonLocalizedAttributesSchema = yup
  .object()
  .shape({
    model: yup.string().required(),
    id: yup.mixed().when('model', {
      is: model => get('kind', strapi.getModel(model)) === 'singleType',
      then: yup.strapiID().nullable(),
      otherwise: yup.strapiID().required(),
    }),
    locale: yup.string().required(),
  })
  .noUnknown()
  .required();

const validateGetNonLocalizedAttributesInput = data => {
  return validateGetNonLocalizedAttributesSchema
    .validate(data, { strict: true, abortEarly: false })
    .catch(handleReject);
};

module.exports = {
  validateGetNonLocalizedAttributesInput,
};
