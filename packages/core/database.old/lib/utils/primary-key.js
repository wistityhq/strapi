'use strict';

const _ = require('lodash');

/**
 * If exists, rename the key "id" by the primary key name of the model ("_id" by default for mongoose).
 */
const replaceIdByPrimaryKey = (params, model) => {
  const newParams = { ...params };
  if (_.has(params, 'id')) {
    delete newParams.id;
    newParams[model.primaryKey] = params[model.primaryKey] || params.id;
  }
  return newParams;
};

module.exports = {
  replaceIdByPrimaryKey,
};
