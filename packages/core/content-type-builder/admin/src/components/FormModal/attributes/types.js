import * as yup from 'yup';
import { translatedErrors as errorsTrads } from '@strapi/helper-plugin';
import getTrad from '../../../utils/getTrad';
import getRelationType from '../../../utils/getRelationType';
import {
  alreadyUsedAttributeNames,
  createTextShape,
  isMinSuperiorThanMax,
  isNameAllowed,
  validators,
  NAME_REGEX,
} from './validation/common';

const types = {
  date: (usedAttributeNames, reservedNames) => {
    const shape = {
      name: validators.name(usedAttributeNames, reservedNames),
      type: validators.type(),
    };

    return yup.object(shape);
  },
  datetime: (usedAttributeNames, reservedNames) => {
    const shape = {
      name: validators.name(usedAttributeNames, reservedNames),
      type: validators.type(),
    };

    return yup.object(shape);
  },
  time: (usedAttributeNames, reservedNames) => {
    const shape = {
      name: validators.name(usedAttributeNames, reservedNames),
      type: validators.type(),
    };

    return yup.object(shape);
  },
  default: (usedAttributeNames, reservedNames) => {
    const shape = {
      name: validators.name(usedAttributeNames, reservedNames),
      type: validators.type(),
    };

    return yup.object(shape);
  },
  biginteger: (usedAttributeNames, reservedNames) => {
    const shape = {
      name: validators.name(usedAttributeNames, reservedNames),
      type: validators.type(),
      default: yup
        .string()
        .nullable()
        .matches(/^\d*$/),
      unique: validators.unique(),
      required: validators.required(),
      max: yup
        .string()
        .nullable()
        .matches(/^\d*$/, errorsTrads.regex),
      min: yup
        .string()
        .nullable()
        .test(isMinSuperiorThanMax)
        .matches(/^\d*$/, errorsTrads.regex),
    };

    return yup.object(shape);
  },
  boolean: (usedAttributeNames, reservedNames) => {
    const shape = {
      name: validators.name(usedAttributeNames, reservedNames),
      default: yup.boolean().nullable(),
      required: validators.required(),
      unique: validators.unique(),
    };

    return yup.object(shape);
  },
  component: (usedAttributeNames, reservedNames) => {
    const shape = {
      name: validators.name(usedAttributeNames, reservedNames),
      type: validators.type(),
      required: validators.required(),
      max: validators.max(),
      min: validators.min(),
      component: yup.string().required(errorsTrads.required),
    };

    return yup.object(shape);
  },
  decimal: (usedAttributeNames, reservedNames) => {
    const shape = {
      name: validators.name(usedAttributeNames, reservedNames),
      type: validators.type(),
      default: yup.number(),
      required: validators.required(),
      max: yup.number(),
      min: yup.number().test(isMinSuperiorThanMax),
    };

    return yup.object(shape);
  },
  dynamiczone: (usedAttributeNames, reservedNames) => {
    const shape = {
      name: validators.name(usedAttributeNames, reservedNames),
      type: validators.type(),
      required: validators.required(),
      max: validators.max(),
      min: validators.min(),
    };

    return yup.object(shape);
  },
  email: (usedAttributeNames, reservedNames) => {
    const shape = {
      name: validators.name(usedAttributeNames, reservedNames),
      type: validators.type(),
      default: yup
        .string()
        .email()
        .nullable(),
      unique: validators.unique(),
      required: validators.required(),
      maxLength: validators.maxLength(),
      minLength: validators.minLength(),
    };

    return yup.object(shape);
  },
  enumeration: (usedAttributeNames, reservedNames) => {
    const ENUM_REGEX = new RegExp('^[_A-Za-z][_0-9A-Za-z]*$');

    const shape = {
      name: yup
        .string()
        .test(alreadyUsedAttributeNames(usedAttributeNames))
        .test(isNameAllowed(reservedNames))
        .matches(ENUM_REGEX, errorsTrads.regex)
        .required(errorsTrads.required),
      type: validators.type(),
      default: validators.default(),
      unique: validators.unique(),
      required: validators.required(),
      enum: yup
        .array()
        .of(yup.string())
        .min(1, errorsTrads.min)
        .test({
          name: 'areEnumValuesUnique',
          message: getTrad('error.validation.enum-duplicate'),
          test: values => {
            const filtered = [...new Set(values)];

            return filtered.length === values.length;
          },
        })
        .test({
          name: 'valuesMatchesRegex',
          message: errorsTrads.regex,
          test: values => {
            return values.every(val => val === '' || ENUM_REGEX.test(val));
          },
        })
        .test({
          name: 'doesNotHaveEmptyValues',
          message: getTrad('error.validation.enum-empty-string'),
          test: values => !values.some(val => val === ''),
        }),
      enumName: yup.string().nullable(),
    };

    return yup.object(shape);
  },
  float: (usedAttributeNames, reservedNames) => {
    const shape = {
      name: validators.name(usedAttributeNames, reservedNames),
      type: validators.type(),
      required: validators.required(),
      default: yup.number(),
      max: yup.number(),
      min: yup.number().test(isMinSuperiorThanMax),
    };

    return yup.object(shape);
  },
  integer: (usedAttributeNames, reservedNames) => {
    const shape = {
      name: validators.name(usedAttributeNames, reservedNames),
      type: validators.type(),
      default: yup.number().integer(),
      unique: validators.unique(),
      required: validators.required(),
      max: validators.max(),
      min: validators.min(),
    };

    return yup.object(shape);
  },
  json: (usedAttributeNames, reservedNames) => {
    const shape = {
      name: validators.name(usedAttributeNames, reservedNames),
      type: validators.type(),
      required: validators.required(),
      unique: validators.unique(),
    };

    return yup.object(shape);
  },
  media: (usedAttributeNames, reservedNames) => {
    const shape = {
      name: validators.name(usedAttributeNames, reservedNames),
      type: validators.type(),
      multiple: yup.boolean(),
      required: validators.required(),
      allowedTypes: yup
        .array()
        .of(yup.string().oneOf(['images', 'videos', 'files']))
        .min(1)
        .nullable(),
    };

    return yup.object(shape);
  },
  password: (usedAttributeNames, reservedNames) => {
    const shape = {
      name: validators.name(usedAttributeNames, reservedNames),
      type: validators.type(),
      default: validators.default(),
      unique: validators.unique(),
      required: validators.required(),
      maxLength: validators.maxLength(),
      minLength: validators.minLength(),
    };

    return yup.object(shape);
  },
  relation: (
    usedAttributeNames,
    reservedNames,
    alreadyTakenTargetAttributes,
    { initialData, modifiedData }
  ) => {
    const shape = {
      name: validators.name(usedAttributeNames, reservedNames),
      target: yup.string().required(errorsTrads.required),
      relation: yup.string().required(),
      type: yup.string().required(),
      targetAttribute: yup.lazy(() => {
        const relationType = getRelationType(modifiedData.relation, modifiedData.targetAttribute);

        if (relationType === 'oneWay' || relationType === 'manyWay') {
          return yup.string().nullable();
        }

        let schema = yup.string().test(isNameAllowed(reservedNames));
        const initialForbiddenName = [...alreadyTakenTargetAttributes, modifiedData.name];

        let forbiddenTargetAttributeName = initialForbiddenName.filter(
          val => val !== initialData.targetAttribute
        );

        return schema
          .matches(NAME_REGEX, errorsTrads.regex)
          .test({
            name: 'forbiddenTargetAttributeName',
            message: getTrad('error.validation.relation.targetAttribute-taken'),
            test: value => {
              if (!value) {
                return false;
              }

              return !forbiddenTargetAttributeName.includes(value);
            },
          })
          .required(errorsTrads.required);
      }),
    };

    return yup.object(shape);
  },
  richtext: (usedAttributeNames, reservedNames) => {
    const shape = {
      name: validators.name(usedAttributeNames, reservedNames),
      type: validators.type(),
      default: validators.default(),
      unique: validators.unique(),
      required: validators.required(),
      maxLength: validators.maxLength(),
      minLength: validators.minLength(),
    };

    return yup.object(shape);
  },
  string: (usedAttributeNames, reservedNames) => {
    const shape = createTextShape(usedAttributeNames, reservedNames);

    return yup.object(shape);
  },
  text: (usedAttributeNames, reservedNames) => {
    const shape = createTextShape(usedAttributeNames, reservedNames);

    return yup.object(shape);
  },
  uid: (usedAttributeNames, reservedNames) => {
    const shape = createTextShape(usedAttributeNames, reservedNames);

    return yup.object(shape);
  },
};

export default types;
