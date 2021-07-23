'use strict';

const _ = require('lodash');
const { contentTypes: contentTypesUtils } = require('@strapi/utils');

const { PUBLISHED_AT_ATTRIBUTE } = contentTypesUtils.constants;

const NON_SORTABLES = ['component', 'json', 'media', 'richtext', 'dynamiczone'];
const SORTABLE_RELATIONS = ['oneToOne', 'manyToOne'];

const NON_LISTABLES = ['component', 'json', 'password', 'richtext', 'dynamiczone'];
const LISTABLE_RELATIONS = ['oneToOne', 'oneToMany', 'manyToOne', 'manyToMany'];

// hidden fields are fields that are configured to be hidden from list, and edit views
const isHidden = (schema, name) => {
  if (!_.has(schema.attributes, name)) {
    return false;
  }

  const isHidden = _.get(schema, ['config', 'attributes', name, 'hidden'], false);
  if (isHidden === true) {
    return true;
  }

  return false;
};

const isListable = (schema, name) => {
  if (!_.has(schema.attributes, name)) {
    return false;
  }

  if (isHidden(schema, name)) {
    return false;
  }

  const attribute = schema.attributes[name];
  if (NON_LISTABLES.includes(attribute.type)) {
    return false;
  }

  if (isRelation(attribute) && !LISTABLE_RELATIONS.includes(attribute.relationType)) {
    return false;
  }

  return true;
};

const isSortable = (schema, name) => {
  if (!_.has(schema.attributes, name)) {
    return false;
  }

  if (schema.modelType === 'component' && name === 'id') return false;

  const attribute = schema.attributes[name];
  if (NON_SORTABLES.includes(attribute.type)) {
    return false;
  }

  if (isRelation(attribute) && !SORTABLE_RELATIONS.includes(attribute.relationType)) {
    return false;
  }

  return true;
};

const isSearchable = (schema, name) => {
  return isSortable(schema, name);
};

const isVisible = (schema, name) => {
  if (!_.has(schema.attributes, name)) {
    return false;
  }

  if (isHidden(schema, name)) {
    return false;
  }

  if (isTimestamp(schema, name) || name === 'id') {
    return false;
  }

  if (isPublicationField(name)) {
    return false;
  }

  return true;
};

const isPublicationField = name => {
  return PUBLISHED_AT_ATTRIBUTE === name;
};

const isTimestamp = (schema, name) => {
  if (!_.has(schema.attributes, name)) {
    return false;
  }

  const timestampsOpt = _.get(schema, ['options', 'timestamps']);
  if (!timestampsOpt || !Array.isArray(timestampsOpt)) {
    return false;
  }

  if (timestampsOpt.includes(name)) {
    return true;
  }
};

const isRelation = attribute => attribute.type === 'relation';

const hasRelationAttribute = (schema, name) => {
  if (!_.has(schema.attributes, name)) {
    return false;
  }

  if (isHidden(schema, name)) {
    return false;
  }

  if (!isVisible(schema, name)) {
    return false;
  }

  return isRelation(schema.attributes[name]);
};

const hasEditableAttribute = (schema, name) => {
  if (!_.has(schema.attributes, name)) {
    return false;
  }

  if (isHidden(schema, name)) {
    return false;
  }

  if (!isVisible(schema, name)) {
    return false;
  }

  if (isRelation(schema.attributes[name])) {
    if (schema.modelType === 'component') return true;
    return false;
  }

  return true;
};

const findFirstStringAttribute = schema => {
  return Object.keys(schema.attributes || {}).find(key => {
    const { type } = schema.attributes[key];
    return type === 'string' && key !== 'id';
  });
};

const getDefaultMainField = schema => findFirstStringAttribute(schema) || 'id';

module.exports = {
  isSortable,
  isVisible,
  isSearchable,
  isRelation,
  isListable,
  hasEditableAttribute,
  hasRelationAttribute,
  getDefaultMainField,
};
