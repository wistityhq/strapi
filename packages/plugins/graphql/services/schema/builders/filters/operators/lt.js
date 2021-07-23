'use strict';

const LT_FIELD_NAME = 'lt';

module.exports = {
  fieldName: LT_FIELD_NAME,

  strapiOperator: '$lt',

  add(t, type) {
    t.field(LT_FIELD_NAME, { type });
  },
};
