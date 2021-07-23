'use strict';

const { GRAPHQL_SCALARS } = require('../../../../types/constants');

const EQ_FIELD_NAME = 'eq';

module.exports = {
  fieldName: EQ_FIELD_NAME,

  strapiOperator: '$eq',

  add(t, type) {
    if (!GRAPHQL_SCALARS.includes(type)) {
      throw new Error(`Can't use "${EQ_FIELD_NAME}" operator. "${type}" is not a valid scalar`);
    }

    t.field(EQ_FIELD_NAME, { type });
  },
};
