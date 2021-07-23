'use strict';

const _ = require('lodash');

module.exports = (initialConfig = {}) => {
  const _config = Object.assign({}, initialConfig); // not deep clone because it would break some config

  return {
    ..._config,
    get(path, defaultValue) {
      return _.get(_config, path, defaultValue);
    },
    set(path, val) {
      _.set(_config, path, val);
      return this;
    },
    has(path) {
      return _.has(_config, path);
    },
  };
};
