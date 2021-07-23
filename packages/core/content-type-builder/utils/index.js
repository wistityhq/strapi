'use strict';

const { prop } = require('lodash/fp');

// retrieve a local service
const getService = name => {
  return prop(`content-type-builder.services.${name}`, strapi.plugins);
};

module.exports = {
  getService,
};
