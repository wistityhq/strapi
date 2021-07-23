'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const _ = require('lodash');
const Router = require('koa-router');
const createEndpointComposer = require('./utils/composeEndpoint');
/**
 * Router hook
 */

module.exports = strapi => {
  const composeEndpoint = createEndpointComposer(strapi);

  return {
    initialize() {
      _.forEach(strapi.config.routes, value => {
        composeEndpoint(value, { router: strapi.router });
      });

      strapi.router.prefix(strapi.config.get('middleware.settings.router.prefix', ''));

      if (_.has(strapi.admin, 'config.routes')) {
        const router = new Router({ prefix: '/admin' });

        _.get(strapi.admin, 'config.routes', []).forEach(route => {
          composeEndpoint(route, { plugin: 'admin', router });
        });

        // Mount admin router on Strapi router
        strapi.app.use(router.routes()).use(router.allowedMethods());
      }

      if (strapi.plugins) {
        // Parse each plugin's routes.
        _.forEach(strapi.plugins, (plugin, pluginName) => {
          const router = new Router({ prefix: `/${pluginName}` });

          (plugin.routes || []).forEach(route => {
            const hasPrefix = _.has(route.config, 'prefix');
            composeEndpoint(route, {
              plugin: pluginName,
              router: hasPrefix ? strapi.router : router,
            });
          });

          // Mount plugin router
          strapi.app.use(router.routes()).use(router.allowedMethods());
        });
      }
    },
  };
};
