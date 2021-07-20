'use strict';

const _ = require('lodash');

function getSupportedFileExtensions(config, defaultExtensions = ['js' | 'json']) {
  console.log({ config });
  return _.join(config.get('server.loader.extensions', defaultExtensions), '|');
}

module.exports = getSupportedFileExtensions;
