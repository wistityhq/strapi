'use strict';

const permission = require('../../models/Permission');
const role = require('../../models/Role');
const user = require('../../models/User');

module.exports = [
  {
    schema: permission,
  },
  {
    schema: role,
  },
  {
    schema: user,
  },
];
