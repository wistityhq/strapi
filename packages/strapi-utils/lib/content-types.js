'use strict';

const _ = require('lodash');

const SINGLE_TYPE = 'singleType';
const COLLECTION_TYPE = 'collectionType';

const ID_ATTRIBUTE = 'id';
const PUBLISHED_AT_ATTRIBUTE = 'published_at';
const CREATED_BY_ATTRIBUTE = 'created_by';
const UPDATED_BY_ATTRIBUTE = 'updated_by';
const DP_PUB_STATE_LIVE = 'live';
const DP_PUB_STATE_PREVIEW = 'preview';
const DP_PUB_STATES = [DP_PUB_STATE_LIVE, DP_PUB_STATE_PREVIEW];

const NON_WRITABLE_ATTRIBUTES = [ID_ATTRIBUTE, CREATED_BY_ATTRIBUTE, UPDATED_BY_ATTRIBUTE];
const NON_VISIBLE_ATTRIBUTES = [...NON_WRITABLE_ATTRIBUTES, PUBLISHED_AT_ATTRIBUTE];

const constants = {
  ID_ATTRIBUTE,
  PUBLISHED_AT_ATTRIBUTE,
  CREATED_BY_ATTRIBUTE,
  UPDATED_BY_ATTRIBUTE,
  DP_PUB_STATES,
  DP_PUB_STATE_LIVE,
  DP_PUB_STATE_PREVIEW,
  SINGLE_TYPE,
  COLLECTION_TYPE,
};

const getTimestamps = model => {
  const timestamps = _.get(model, 'options.timestamps', []);

  if (!_.isArray(timestamps)) {
    return [];
  }

  return timestamps;
};

const getTimestampsAttributes = model => {
  const timestamps = getTimestamps(model);

  return timestamps.reduce(
    (attributes, attributeName) => ({
      ...attributes,
      [attributeName]: { type: 'timestamp' },
    }),
    {}
  );
};

const getNonWritableAttributes = (model = {}) => {
  const nonWritableAttributes = _.reduce(
    model.attributes,
    (acc, attr, attrName) => (attr.writable === false ? acc.concat(attrName) : acc),
    []
  );

  return _.uniq(
    NON_WRITABLE_ATTRIBUTES.concat(model.primaryKey, getTimestamps(model), nonWritableAttributes)
  );
};

const getWritableAttributes = (model = {}) => {
  return _.difference(Object.keys(model.attributes), getNonWritableAttributes(model));
};

const getNonVisibleAttributes = model => {
  return _.uniq([model.primaryKey, ...getTimestamps(model), ...NON_VISIBLE_ATTRIBUTES]);
};

const getVisibleAttributes = model => {
  return _.difference(_.keys(model.attributes), getNonVisibleAttributes(model));
};

const hasDraftAndPublish = model => _.get(model, 'options.draftAndPublish', false) === true;

const isDraft = (data, model) =>
  hasDraftAndPublish(model) && _.get(data, PUBLISHED_AT_ATTRIBUTE) === null;

const isSingleType = ({ kind = COLLECTION_TYPE }) => kind === SINGLE_TYPE;
const isCollectionType = ({ kind = COLLECTION_TYPE }) => kind === COLLECTION_TYPE;
const isKind = kind => model => model.kind === kind;

const getPrivateAttributes = (model = {}) => {
  return _.union(
    strapi.config.get('api.responses.privateAttributes', []),
    _.get(model, 'options.privateAttributes', []),
    _.keys(_.pickBy(model.attributes, attr => !!attr.private))
  );
};

const isPrivateAttribute = (model = {}, attributeName) => {
  return model && model.privateAttributes && model.privateAttributes.includes(attributeName);
};

const isScalarAttribute = attribute => {
  return (
    !attribute.collection &&
    !attribute.model &&
    attribute.type !== 'component' &&
    attribute.type !== 'dynamiczone'
  );
};

const isMediaAttribute = attr => {
  return (attr.collection || attr.model) === 'file' && attr.plugin === 'upload';
};

module.exports = {
  isScalarAttribute,
  isMediaAttribute,
  getPrivateAttributes,
  getTimestampsAttributes,
  isPrivateAttribute,
  constants,
  getNonWritableAttributes,
  getWritableAttributes,
  getNonVisibleAttributes,
  getVisibleAttributes,
  hasDraftAndPublish,
  isDraft,
  isSingleType,
  isCollectionType,
  isKind,
};
