/**
 * Entity validator
 * Module that will validate input data for entity creation or edition
 */
'use strict';

const { has, assoc, prop } = require('lodash/fp');
const strapiUtils = require('@strapi/utils');
const validators = require('./validators');

const { yup, formatYupErrors } = strapiUtils;
const { isMediaAttribute, isScalarAttribute, getWritableAttributes } = strapiUtils.contentTypes;

const addMinMax = (attr, validator, data) => {
  if (Number.isInteger(attr.min) && (attr.required || (Array.isArray(data) && data.length > 0))) {
    validator = validator.min(attr.min);
  }
  if (Number.isInteger(attr.max)) {
    validator = validator.max(attr.max);
  }
  return validator;
};

const addRequiredValidation = createOrUpdate => (required, validator) => {
  if (required) {
    if (createOrUpdate === 'creation') {
      validator = validator.notNil();
    } else if (createOrUpdate === 'update') {
      validator = validator.notNull();
    }
  } else {
    validator = validator.nullable();
  }
  return validator;
};

const addDefault = createOrUpdate => (attr, validator) => {
  if (createOrUpdate === 'creation') {
    if (
      ((attr.type === 'component' && attr.repeatable) || attr.type === 'dynamiczone') &&
      !attr.required
    ) {
      validator = validator.default([]);
    } else {
      validator = validator.default(attr.default);
    }
  } else {
    validator = validator.default(undefined);
  }

  return validator;
};

const preventCast = validator => validator.transform((val, originalVal) => originalVal);

const createComponentValidator = createOrUpdate => (attr, data, { isDraft }) => {
  let validator;

  const model = strapi.getModel(attr.component);
  if (!model) {
    throw new Error('Validation failed: Model not found');
  }

  if (prop('repeatable', attr) === true) {
    validator = yup
      .array()
      .of(
        yup.lazy(item => createModelValidator(createOrUpdate)(model, item, { isDraft }).notNull())
      );
    validator = addRequiredValidation(createOrUpdate)(true, validator);
    validator = addMinMax(attr, validator, data);
  } else {
    validator = createModelValidator(createOrUpdate)(model, data, { isDraft });
    validator = addRequiredValidation(createOrUpdate)(!isDraft && attr.required, validator);
  }

  return validator;
};

const createDzValidator = createOrUpdate => (attr, data, { isDraft }) => {
  let validator;

  validator = yup.array().of(
    yup.lazy(item => {
      const model = strapi.getModel(prop('__component', item));
      const schema = yup
        .object()
        .shape({
          __component: yup
            .string()
            .required()
            .oneOf(Object.keys(strapi.components)),
        })
        .notNull();

      return model
        ? schema.concat(createModelValidator(createOrUpdate)(model, item, { isDraft }))
        : schema;
    })
  );
  validator = addRequiredValidation(createOrUpdate)(true, validator);
  validator = addMinMax(attr, validator, data);

  return validator;
};

const createRelationValidator = createOrUpdate => (attr, data, { isDraft }) => {
  let validator;

  if (Array.isArray(data)) {
    validator = yup.array().of(yup.mixed());
  } else {
    validator = yup.mixed();
  }
  validator = addRequiredValidation(createOrUpdate)(!isDraft && attr.required, validator);

  return validator;
};

const createScalarAttributeValidator = createOrUpdate => (attr, { isDraft }) => {
  let validator;

  if (has(attr.type, validators)) {
    validator = validators[attr.type](attr, { isDraft });
  } else {
    // No validators specified - fall back to mixed
    validator = yup.mixed();
  }

  validator = addRequiredValidation(createOrUpdate)(!isDraft && attr.required, validator);

  return validator;
};

const createAttributeValidator = createOrUpdate => (attr, data, { isDraft }) => {
  let validator;

  if (isMediaAttribute(attr)) {
    validator = yup.mixed();
  } else if (isScalarAttribute(attr)) {
    validator = createScalarAttributeValidator(createOrUpdate)(attr, { isDraft });
  } else {
    if (attr.type === 'component') {
      validator = createComponentValidator(createOrUpdate)(attr, data, { isDraft });
    } else if (attr.type === 'dynamiczone') {
      validator = createDzValidator(createOrUpdate)(attr, data, { isDraft });
    } else {
      validator = createRelationValidator(createOrUpdate)(attr, data, { isDraft });
    }

    validator = preventCast(validator);
  }

  validator = addDefault(createOrUpdate)(attr, validator);

  return validator;
};

const createModelValidator = createOrUpdate => (model, data, { isDraft }) => {
  const writableAttributes = model ? getWritableAttributes(model) : [];

  const schema = writableAttributes.reduce((validators, attributeName) => {
    const validator = createAttributeValidator(createOrUpdate)(
      model.attributes[attributeName],
      prop(attributeName, data),
      { isDraft }
    );

    return assoc(attributeName, validator)(validators);
  }, {});

  return yup.object().shape(schema);
};

const createValidateEntity = createOrUpdate => async (model, data, { isDraft = false } = {}) => {
  try {
    const validator = createModelValidator(createOrUpdate)(model, data, { isDraft }).required();
    return await validator.validate(data, { abortEarly: false });
  } catch (e) {
    throw strapi.errors.badRequest('ValidationError', { errors: formatYupErrors(e) });
  }
};

module.exports = {
  validateEntityCreation: createValidateEntity('creation'),
  validateEntityUpdate: createValidateEntity('update'),
};
