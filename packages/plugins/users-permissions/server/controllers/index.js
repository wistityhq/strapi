'use strict';

const authController = require('../../controllers/auth');
const userController = require('../../controllers/user');
const usersPermissionsController = require('../../controllers/users-permissions');

module.exports = {
  auth: authController,
  user: userController,
  usersPermissions: usersPermissionsController,
};
