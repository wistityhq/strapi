'use strict';

const yup = require('yup');
const { typeKinds, coreUids } = require('../../services/constants');
const { isValidName } = require('./common');

const STRAPI_USER_RELATIONS = ['oneToOne', 'oneToMany'];

const isValidRelation = validNatures =>
  function(value) {
    const allowedRelations =
      this.parent.target === coreUids.STRAPI_USER ? STRAPI_USER_RELATIONS : validNatures;

    return allowedRelations.includes(value)
      ? true
      : this.createError({
          path: this.path,
          message: `must be one of the following values: ${allowedRelations.join(', ')}`,
        });
  };

module.exports = ({ types, relations }) => {
  const contentTypesUIDs = Object.keys(strapi.contentTypes)
    .filter(key => strapi.contentTypes[key].kind === typeKinds.COLLECTION_TYPE)
    .filter(key => !key.startsWith(coreUids.PREFIX) || key === coreUids.STRAPI_USER)
    .concat(['__self__', '__contentType__']);

  return yup.object({
    type: yup
      .string()
      .oneOf(types)
      .required(),
    target: yup
      .string()
      .oneOf(contentTypesUIDs)
      .required(),
    relation: yup
      .string()
      .test('isValidRelation', isValidRelation(relations))
      .required(),
    configurable: yup.boolean().nullable(),
    targetAttribute: yup
      .string()
      .test(isValidName)
      .nullable(),
    private: yup.boolean().nullable(),
    pluginOptions: yup.object(),
  });
};
