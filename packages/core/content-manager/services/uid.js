'use strict';

const _ = require('lodash');
const slugify = require('@sindresorhus/slugify');

module.exports = ({ strapi }) => ({
  async generateUIDField({ contentTypeUID, field, data }) {
    const contentType = strapi.contentTypes[contentTypeUID];
    const { attributes } = contentType;

    const { targetField, default: defaultValue, options } = attributes[field];
    const targetValue = _.get(data, targetField);

    if (!_.isEmpty(targetValue)) {
      return this.findUniqueUID({
        contentTypeUID,
        field,
        value: slugify(targetValue, options),
      });
    }

    return this.findUniqueUID({
      contentTypeUID,
      field,
      value: slugify(defaultValue || contentType.modelName, options),
    });
  },

  async findUniqueUID({ contentTypeUID, field, value }) {
    const query = strapi.db.query(contentTypeUID);

    const possibleColisions = await query
      .findMany({
        where: { [field]: { $contains: value } },
      })
      .then(results => results.map(result => result[field]));

    if (possibleColisions.length === 0) {
      return value;
    }

    let i = 1;
    let tmpUId = `${value}-${i}`;
    while (possibleColisions.includes(tmpUId)) {
      i += 1;
      tmpUId = `${value}-${i}`;
    }

    return tmpUId;
  },

  async checkUIDAvailability({ contentTypeUID, field, value }) {
    const query = strapi.db.query(contentTypeUID);

    const count = await query.count({
      where: { [field]: value },
    });

    if (count > 0) return false;
    return true;
  },
});
