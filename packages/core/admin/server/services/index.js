'use strict';

const action = require('../../services/action');
const auth = require('../../services/auth');
const condition = require('../../services/condition');
const contentType = require('../../services/content-type');
const metrics = require('../../services/metrics');
const passport = require('../../services/passport');
const permission = require('../../services/permission');
const role = require('../../services/role');
const token = require('../../services/token');
const user = require('../../services/user');

module.exports = {
  action,
  auth,
  condition,
  'content-type': contentType,
  metrics,
  passport,
  permission,
  role,
  token,
  user,
};
