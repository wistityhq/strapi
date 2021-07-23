'use strict';

const ENDS_WITH_FIELD_NAME = 'endsWith';

module.exports = {
  fieldName: ENDS_WITH_FIELD_NAME,

  strapiOperator: '$endsWith',

  add(t, type) {
    t.field(ENDS_WITH_FIELD_NAME, { type });
  },
};
