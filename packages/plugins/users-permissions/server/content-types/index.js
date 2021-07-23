'use strict';

const permissionModel = require('../../models/Permission.settings');
const roleModel = require('../../models/Role.settings');
const userModel = require('../../models/User.settings');

module.exports = [
  {
    schema: permissionModel,
  },
  {
    schema: roleModel,
  },
  {
    schema: userModel,
  },
];
