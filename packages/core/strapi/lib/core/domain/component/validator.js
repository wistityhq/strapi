'use strict';

const { yup } = require('@strapi/utils');

const componentSchemaValidator = () =>
  yup.object().shape({
    info: yup
      .object()
      .shape({
        singularName: yup
          .string()
          .isCamelCase()
          .required(),
        pluralName: yup
          .string()
          .isCamelCase()
          .required(),
        displayName: yup.string().required(),
      })
      .required(),
  });

const validateComponentDefinition = data => {
  return componentSchemaValidator.validateSync(data, { strict: true, abortEarly: false });
};

module.exports = {
  validateComponentDefinition,
};
