'use strict';

const hasDraftAndPublish = require('../../config/policies/has-draft-and-publish');
const hasPermissions = require('../../config/policies/hasPermissions');
const routing = require('../../config/policies/routing');

module.exports = {
  'has-draft-and-publish': hasDraftAndPublish,
  hasPermissions,
  routing,
};
