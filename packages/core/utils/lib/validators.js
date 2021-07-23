'use strict';

const yup = require('yup');
const _ = require('lodash');

const MixedSchemaType = yup.mixed;

const isNotNilTest = value => !_.isNil(value);

function isNotNill(msg = '${path} must be defined.') {
  return this.test('defined', msg, isNotNilTest);
}

const isNotNullTest = value => !_.isNull(value);
function isNotNull(msg = '${path} cannot be null.') {
  return this.test('defined', msg, isNotNullTest);
}

function isFunction(message = '${path} is not a function') {
  return this.test('is a function', message, value => _.isUndefined(value) || _.isFunction(value));
}

function isCamelCase(message = '${path} is not in camel case (anExampleOfCamelCase)') {
  return this.test('is in camelCase', message, value => value === _.camelCase(value));
}

function onlyContainsFunctions(message = '${path} contains values that are not functions') {
  return this.test(
    'only contains functions',
    message,
    value => _.isUndefined(value) || (value && Object.values(value).every(_.isFunction))
  );
}

yup.addMethod(yup.mixed, 'notNil', isNotNill);
yup.addMethod(yup.mixed, 'notNull', isNotNull);
yup.addMethod(yup.mixed, 'isFunction', isFunction);
yup.addMethod(yup.string, 'isCamelCase', isCamelCase);
yup.addMethod(yup.object, 'onlyContainsFunctions', onlyContainsFunctions);

class StrapiIDSchema extends MixedSchemaType {
  constructor() {
    super({ type: 'strapiID' });
  }

  _typeCheck(value) {
    return typeof value === 'string' || (Number.isInteger(value) && value >= 0);
  }
}

yup.strapiID = () => new StrapiIDSchema();

/**
 * Returns a formatted error for http responses
 * @param {Object} validationError - a Yup ValidationError
 */
const formatYupErrors = validationError => {
  if (!validationError.inner) {
    throw new Error('invalid.input');
  }

  if (validationError.inner.length === 0) {
    if (validationError.path === undefined) return validationError.errors;
    return { [validationError.path]: validationError.errors };
  }

  return validationError.inner.reduce((acc, err) => {
    acc[err.path] = err.errors;
    return acc;
  }, {});
};

module.exports = {
  yup,
  formatYupErrors,
};
