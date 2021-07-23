'use strict';

const admin = require('../../controllers/admin');
const authentication = require('../../controllers/authentication');
const permission = require('../../controllers/permission');
const role = require('../../controllers/role');
const user = require('../../controllers/user');
const webhooks = require('../../controllers/Webhooks');
const authenticatedUser = require('../../controllers/authenticated-user');

module.exports = {
  admin,
  authentication,
  permission,
  role,
  user,
  webhooks,
  'authenticated-user': authenticatedUser,
};
