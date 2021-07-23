'use strict';

const { prop } = require('lodash/fp');

const getService = name => {
  return prop(`users-permissions.services.${name}`, strapi.plugins);
};

module.exports = {
  getService,
};
