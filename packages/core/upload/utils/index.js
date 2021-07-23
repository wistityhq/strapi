'use strict';

const { prop } = require('lodash/fp');

const getService = name => {
  return prop(`upload.services.${name}`, strapi.plugins);
};

module.exports = {
  getService,
};
