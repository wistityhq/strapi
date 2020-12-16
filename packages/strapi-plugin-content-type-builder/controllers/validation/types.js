'use strict';

const _ = require('lodash');
const yup = require('yup');

const {
  validators,
  areEnumValuesUnique,
  isValidDefaultJSON,
  isValidName,
  isValidEnum,
  isValidUID,
  isValidRegExpPattern,
} = require('./common');
const { hasComponent } = require('../../utils/attributes');
const { modelTypes, VALID_UID_TARGETS } = require('../../services/constants');

const maxLengthIsGreaterThanOrEqualToMinLength = {
  name: 'isGreaterThanMin',
  message: 'maxLength must be greater or equal to minLength',
  test: function(value) {
    const { minLength } = this.parent;
    if (!_.isUndefined(minLength) && !_.isUndefined(value) && value < minLength) {
      return false;
    }

    return true;
  },
};

const getTypeValidator = (attribute, { types, modelType, attributes }) => {
  return yup.object({
    type: yup
      .string()
      .oneOf(types)
      .required(),
    configurable: yup.boolean().nullable(),
    private: yup.boolean().nullable(),
    ...getTypeShape(attribute, { modelType, attributes }),
  });
};

const getTypeShape = (attribute, { modelType, attributes } = {}) => {
  switch (attribute.type) {
    /**
     * complexe types
     */

    case 'media': {
      return {
        multiple: yup.boolean(),
        required: validators.required,
        unique: validators.unique,
        allowedTypes: yup
          .array()
          .of(yup.string().oneOf(['images', 'videos', 'files']))
          .min(1),
      };
    }

    case 'uid': {
      return {
        required: validators.required,
        targetField: yup
          .string()
          .oneOf(
            Object.keys(attributes).filter(key =>
              VALID_UID_TARGETS.includes(_.get(attributes[key], 'type'))
            )
          )
          .nullable(),
        default: yup
          .string()
          .test(
            'isValidDefaultUID',
            'cannot define a default UID if the targetField is set',
            function(value) {
              const { targetField } = this.parent;
              if (_.isNil(targetField) || _.isNil(value)) {
                return true;
              }

              return false;
            }
          )
          .test(isValidUID),
        regex: yup
          .string()
          .test('isValidRegex', 'cannot define a Regex if the targetField is set', function(value) {
            const { targetField } = this.parent;
            if (_.isNil(targetField) || _.isNil(value)) {
              return true;
            }

            return false;
          })
          .test(isValidRegExpPattern),
        minLength: validators.minLength,
        maxLength: validators.maxLength.max(256).test(maxLengthIsGreaterThanOrEqualToMinLength),
        options: yup.object().shape({
          separator: yup.string(),
          lowercase: yup.boolean(),
          decamelize: yup.boolean(),
          customReplacements: yup.array().of(
            yup
              .array()
              .of(yup.string())
              .min(2)
              .max(2)
          ),
          preserveLeadingUnderscore: yup.boolean(),
        }),
      };
    }

    /**
     * scalar types
     */
    case 'string':
    case 'text': {
      return {
        default: yup.string(),
        required: validators.required,
        unique: validators.unique,
        minLength: validators.minLength,
        maxLength: validators.maxLength,
        regex: yup.string().test(isValidRegExpPattern),
      };
    }
    case 'richtext': {
      return {
        default: yup.string(),
        required: validators.required,
        minLength: validators.minLength,
        maxLength: validators.maxLength,
      };
    }
    case 'json': {
      return {
        default: yup.mixed().test(isValidDefaultJSON),
        required: validators.required,
        unique: validators.unique,
      };
    }
    case 'enumeration': {
      return {
        enum: yup
          .array()
          .of(
            yup
              .string()
              .test(isValidEnum)
              .required()
          )
          .min(1)
          .test(areEnumValuesUnique)
          .required(),
        default: yup.string().when('enum', enumVal => yup.string().oneOf(enumVal)),
        enumName: yup.string().test(isValidName),
        required: validators.required,
        unique: validators.unique,
      };
    }
    case 'password': {
      return {
        required: validators.required,
        minLength: validators.minLength,
        maxLength: validators.maxLength,
      };
    }
    case 'email': {
      return {
        default: yup.string().email(),
        required: validators.required,
        unique: validators.unique,
        minLength: validators.minLength,
        maxLength: validators.maxLength,
      };
    }
    case 'integer': {
      return {
        default: yup.number().integer(),
        required: validators.required,
        unique: validators.unique,
        min: yup.number().integer(),
        max: yup.number().integer(),
      };
    }
    case 'biginteger': {
      return {
        default: yup
          .string()
          .nullable()
          .matches(/^\d*$/),
        required: validators.required,
        unique: validators.unique,
        min: yup
          .string()
          .nullable()
          .matches(/^\d*$/),
        max: yup
          .string()
          .nullable()
          .matches(/^\d*$/),
      };
    }
    case 'float': {
      return {
        default: yup.number(),
        required: validators.required,
        unique: validators.unique,
        min: yup.number(),
        max: yup.number(),
      };
    }
    case 'decimal': {
      return {
        default: yup.number(),
        required: validators.required,
        unique: validators.unique,
        min: yup.number(),
        max: yup.number(),
      };
    }
    case 'time':
    case 'datetime':
    case 'date': {
      return {
        default: yup.string(),
        required: validators.required,
        unique: validators.unique,
      };
    }
    case 'boolean': {
      return {
        default: yup.boolean(),
        required: validators.required,
        unique: validators.unique,
      };
    }

    case 'component': {
      return {
        required: validators.required,
        repeatable: yup.boolean(),
        component: yup
          .string()
          .test({
            name: 'Check max component nesting is 1 lvl',
            test: function(compoUID) {
              const targetCompo = strapi.components[compoUID];
              if (!targetCompo) return true; // ignore this error as it will fail beforehand

              if (modelType === modelTypes.COMPONENT && hasComponent(targetCompo)) {
                return this.createError({
                  path: this.path,
                  message: `${targetCompo.modelName} already as a nested compoent. You cannot have more than one level of nesting inside your components.`,
                });
              }
              return true;
            },
          })
          .required(),
        min: yup.number(),
        max: yup.number(),
      };
    }

    case 'dynamiczone': {
      return {
        required: validators.required,
        components: yup
          .array()
          .of(yup.string().required())
          .test('isArray', '${path} must be an array', value => Array.isArray(value)),
        min: yup.number(),
        max: yup.number(),
      };
    }

    default: {
      return {};
    }
  }
};

module.exports = getTypeValidator;
