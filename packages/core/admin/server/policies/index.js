'use strict';

const hasPermissions = require('../../config/policies/hasPermissions');
const isAuthenticatedAdmin = require('../../config/policies/isAuthenticatedAdmin');

module.exports = {
  hasPermissions,
  isAuthenticatedAdmin,
};
