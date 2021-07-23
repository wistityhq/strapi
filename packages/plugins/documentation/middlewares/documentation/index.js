'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const path = require('path');
const _ = require('lodash');
const swaggerUi = require('swagger-ui-dist');
const koaStatic = require('koa-static');

// Variables.
const initialRoutes = [];

module.exports = strapi => {
  return {
    beforeInitialize() {
      strapi.config.middleware.load.before.push('documentation');

      initialRoutes.push(..._.cloneDeep(strapi.plugins.documentation.config.routes));
    },

    initialize() {
      // Find the plugins routes.
      strapi.plugins.documentation.config.routes = strapi.plugins.documentation.config.routes.map(
        (route, index) => {
          if (route.handler === 'Documentation.getInfos') {
            return route;
          }

          if (route.handler === 'Documentation.index' || route.path === '/login') {
            route.config.policies = initialRoutes[index].config.policies;
          }

          // Set prefix to empty to be able to customise it.
          if (strapi.config.has('plugins.documentation.x-strapi-config.path')) {
            route.config.prefix = '';
            route.path = `/${strapi.config.get('plugins.documentation.x-strapi-config').path}${
              route.path
            }`.replace('//', '/');
          }

          return route;
        }
      );

      strapi.router.get('/plugins/documentation/*', async (ctx, next) => {
        ctx.url = path.basename(ctx.url);

        return await koaStatic(swaggerUi.getAbsoluteFSPath(), {
          maxage: strapi.config.middleware.settings.public.maxAge,
          defer: true,
        })(ctx, next);
      });
    },
  };
};
