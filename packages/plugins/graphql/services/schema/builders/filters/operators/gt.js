'use strict';

const GT_FIELD_NAME = 'gt';

module.exports = {
  fieldName: GT_FIELD_NAME,

  strapiOperator: '$gt',

  add(t, type) {
    t.field(GT_FIELD_NAME, { type });
  },
};
