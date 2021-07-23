'use strict';

const NOT_FIELD_NAME = 'NOT';

module.exports = {
  fieldName: NOT_FIELD_NAME,

  strapiOperator: '$not',

  add(t, type) {
    t.field(NOT_FIELD_NAME, { type: type });
  },
};
