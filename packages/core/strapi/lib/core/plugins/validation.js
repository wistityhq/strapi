'use strict';

const { kebabCase } = require('lodash/fp');
const { yup } = require('@strapi/utils');

const strapiServerSchema = yup
  .object()
  .shape({
    bootstrap: yup
      .mixed()
      .isFunction()
      .required(),
    destroy: yup
      .mixed()
      .isFunction()
      .required(),
    register: yup
      .mixed()
      .isFunction()
      .required(),
    config: yup.object().required(),
    routes: yup.array().required(), // may be removed later
    controllers: yup.object().required(), // may be removed later
    services: yup.object().required(),
    policies: yup.object().required(),
    middlewares: yup.object().required(), // may be removed later
    contentTypes: yup.array().required(),
  })
  .noUnknown();

const validateStrapiServer = data => {
  return strapiServerSchema.validateSync(data, { strict: true, abortEarly: false });
};

const validateContentTypesUnicity = contentTypes => {
  const names = [];
  contentTypes.forEach(ct => {
    const singularName = kebabCase(ct.schema.info.singularName);
    const pluralName = kebabCase(ct.schema.info.pluralName);
    if (names.includes(singularName)) {
      throw new Error(`The singular name "${ct.schema.info.singularName}" should be unique`);
    }
    names.push(singularName);
    if (names.includes(pluralName)) {
      throw new Error(`The plural name "${ct.schema.info.pluralName}" should be unique`);
    }
    names.push(pluralName);
  });
};

module.exports = {
  validateStrapiServer,
  validateContentTypesUnicity,
};
