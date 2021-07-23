'use strict';

const bootstrap = require('./server/bootstrap');
const contentTypes = require('./server/content-types');
const policies = require('./server/policies');
const services = require('./server/services');
const routes = require('./server/routes');
const controllers = require('./server/controllers');
const middlewares = require('./server/middlewares');

module.exports = () => ({
  register: () => {},
  bootstrap,
  routes,
  controllers,
  middlewares,
  contentTypes,
  policies,
  services,
});
