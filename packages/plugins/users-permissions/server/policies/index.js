'use strict';

const isAuthenticated = require('../../config/policies/isAuthenticated');
const permissions = require('../../config/policies/permissions');
const rateLimit = require('../../config/policies/rateLimit');

module.exports = {
  isAuthenticated,
  permissions,
  rateLimit,
};
