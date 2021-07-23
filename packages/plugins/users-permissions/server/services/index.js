'use strict';

const jwtService = require('../../services/jwt');
const providersService = require('../../services/providers');
const userService = require('../../services/user');
const usersPermissionsService = require('../../services/users-permissions');

module.exports = {
  jwt: jwtService,
  providers: providersService,
  user: userService,
  'users-permissions': usersPermissionsService,
};
