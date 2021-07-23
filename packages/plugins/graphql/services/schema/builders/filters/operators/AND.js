'use strict';

const { list } = require('nexus');

const AND_FIELD_NAME = 'AND';

module.exports = {
  fieldName: AND_FIELD_NAME,

  strapiOperator: '$and',

  add(t, type) {
    t.field(AND_FIELD_NAME, { type: list(type) });
  },
};
