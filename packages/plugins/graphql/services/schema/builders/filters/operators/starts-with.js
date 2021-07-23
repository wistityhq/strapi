'use strict';

const STARTS_WITH_FIELD_NAME = 'startsWith';

module.exports = {
  fieldName: STARTS_WITH_FIELD_NAME,

  strapiOperator: '$startsWith',

  add(t, type) {
    t.field(STARTS_WITH_FIELD_NAME, { type });
  },
};
