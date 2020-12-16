'use strict';

const _ = require('lodash');
const slugify = require('@sindresorhus/slugify');
const RandExp = require('randexp');

module.exports = {
  async generateUIDField({ contentTypeUID, field, data }) {
    const contentType = strapi.contentTypes[contentTypeUID];
    const { attributes } = contentType;

    const { targetField, default: defaultValue, regex, options } = attributes[field];
    const targetValue = _.get(data, targetField);

    if (!_.isEmpty(targetValue)) {
      return this.findUniqueUID({
        contentTypeUID,
        field,
        value: slugify(targetValue, options),
      });
    }

    if (!_.isEmpty(regex)) {
      return new RandExp(regex).gen();
    }

    return this.findUniqueUID({
      contentTypeUID,
      field,
      value: slugify(defaultValue || contentType.modelName, options),
    });
  },

  async findUniqueUID({ contentTypeUID, field, value }) {
    const query = strapi.db.query(contentTypeUID);

    const possibleCollisions = await query
      .find({
        [`${field}_contains`]: value,
        _limit: -1,
      })
      .then(results => results.map(result => result[field]));

    if (possibleCollisions.length === 0) {
      return value;
    }

    let i = 1;
    let tmpUId = `${value}-${i}`;
    while (possibleCollisions.includes(tmpUId)) {
      i += 1;
      tmpUId = `${value}-${i}`;
    }

    return tmpUId;
  },

  async checkUIDAvailability({ contentTypeUID, field, value }) {
    const query = strapi.db.query(contentTypeUID);

    const count = await query.count({
      [field]: value,
    });

    if (count > 0) return false;
    return true;
  },
};
