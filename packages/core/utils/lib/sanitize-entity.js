'use strict';

const _ = require('lodash');
const {
  constants,
  isPrivateAttribute,
  getNonWritableAttributes,
  getNonVisibleAttributes,
  getWritableAttributes,
} = require('./content-types');

const { ID_ATTRIBUTE, CREATED_AT_ATTRIBUTE, UPDATED_AT_ATTRIBUTE } = constants;

const sanitizeEntity = (dataSource, options) => {
  const { model, withPrivate = false, isOutput = true, includeFields = null } = options;

  if (typeof dataSource !== 'object' || _.isNil(dataSource)) {
    return dataSource;
  }

  const data = parseOriginalData(dataSource);

  if (typeof data !== 'object' || _.isNil(data)) {
    return data;
  }

  if (_.isArray(data)) {
    return data.map(entity => sanitizeEntity(entity, options));
  }

  if (_.isNil(model)) {
    if (isOutput) {
      return null;
    } else {
      return data;
    }
  }

  const { attributes } = model;
  const allowedFields = getAllowedFields({ includeFields, model, isOutput });

  const reducerFn = (acc, value, key) => {
    const attribute = attributes[key];
    const allowedFieldsHasKey = allowedFields.includes(key);

    if (shouldRemoveAttribute(model, key, attribute, { withPrivate, isOutput })) {
      return acc;
    }

    // Relations
    const relation = attribute && (attribute.model || attribute.collection || attribute.component);
    if (relation) {
      if (_.isNil(value)) {
        return { ...acc, [key]: value };
      }

      const [nextFields, isAllowed] = includeFields
        ? getNextFields(allowedFields, key, { allowedFieldsHasKey })
        : [null, true];

      if (!isAllowed) {
        return acc;
      }

      const baseOptions = {
        withPrivate,
        isOutput,
        includeFields: nextFields,
      };

      let sanitizeFn;
      if (relation === '*') {
        sanitizeFn = entity => {
          if (_.isNil(entity) || !_.has(entity, '__contentType')) {
            return entity;
          }

          return sanitizeEntity(entity, {
            model: strapi.getModel(entity.__contentType),
            ...baseOptions,
          });
        };
      } else {
        sanitizeFn = entity =>
          sanitizeEntity(entity, {
            model: strapi.getModel(relation, attribute.plugin),
            ...baseOptions,
          });
      }

      const nextVal = Array.isArray(value) ? value.map(sanitizeFn) : sanitizeFn(value);

      return { ...acc, [key]: nextVal };
    }

    const isAllowedField = !includeFields || allowedFieldsHasKey;

    // Dynamic zones
    if (attribute && attribute.type === 'dynamiczone' && value !== null && isAllowedField) {
      const nextVal = value.map(elem =>
        sanitizeEntity(elem, {
          model: strapi.getModel(elem.__component),
          withPrivate,
          isOutput,
        })
      );
      return { ...acc, [key]: nextVal };
    }

    // Other fields
    if (isAllowedField) {
      return { ...acc, [key]: value };
    }

    return acc;
  };

  return _.reduce(data, reducerFn, {});
};

const parseOriginalData = data => (_.isFunction(data.toJSON) ? data.toJSON() : data);

const COMPONENT_FIELDS = ['__component'];
const STATIC_FIELDS = [ID_ATTRIBUTE];

const getAllowedFields = ({ includeFields, model, isOutput }) => {
  const nonWritableAttributes = getNonWritableAttributes(model);
  const nonVisibleAttributes = getNonVisibleAttributes(model);

  const writableAttributes = getWritableAttributes(model);

  const nonVisibleWritableAttributes = _.intersection(writableAttributes, nonVisibleAttributes);

  return _.concat(
    includeFields || [],
    ...(isOutput
      ? [
          STATIC_FIELDS,
          CREATED_AT_ATTRIBUTE,
          UPDATED_AT_ATTRIBUTE,
          COMPONENT_FIELDS,
          ...nonWritableAttributes,
          ...nonVisibleAttributes,
        ]
      : [STATIC_FIELDS, COMPONENT_FIELDS, ...nonVisibleWritableAttributes])
  );
};

const getNextFields = (fields, key, { allowedFieldsHasKey }) => {
  const searchStr = `${key}.`;

  const transformedFields = (fields || [])
    .filter(field => field.startsWith(searchStr))
    .map(field => field.replace(searchStr, ''));

  const isAllowed = allowedFieldsHasKey || transformedFields.length > 0;
  const nextFields = allowedFieldsHasKey ? null : transformedFields;

  return [nextFields, isAllowed];
};

const shouldRemoveAttribute = (model, key, attribute = {}, { withPrivate, isOutput }) => {
  const isPassword = attribute.type === 'password';
  const isPrivate = isPrivateAttribute(model, key);

  const shouldRemovePassword = isOutput;
  const shouldRemovePrivate = !withPrivate && isOutput;

  return !!((isPassword && shouldRemovePassword) || (isPrivate && shouldRemovePrivate));
};

module.exports = sanitizeEntity;
