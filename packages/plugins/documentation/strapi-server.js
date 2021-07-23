'use strict';

const bootstrap = require('./server/bootstrap');
const policies = require('./server/policies');
const services = require('./server/services');
const routes = require('./server/routes');
const controllers = require('./server/controllers');
const middlewares = require('./server/middlewares');
const config = require('./server/config');

module.exports = () => {
  return {
    bootstrap,
    config,
    routes,
    controllers,
    middlewares,
    policies,
    services,
  };
};
