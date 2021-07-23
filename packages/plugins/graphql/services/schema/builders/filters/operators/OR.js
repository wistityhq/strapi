'use strict';

const { list } = require('nexus');

const OR_FIELD_NAME = 'OR';

module.exports = {
  fieldName: OR_FIELD_NAME,

  strapiOperator: '$or',

  add(t, type) {
    t.field(OR_FIELD_NAME, { type: list(type) });
  },
};
