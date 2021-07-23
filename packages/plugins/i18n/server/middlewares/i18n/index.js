'use strict';

const { getOr, get, isMatch } = require('lodash/fp');
const _ = require('lodash');

module.exports = strapi => {
  return {
    beforeInitialize() {
      strapi.config.middleware.load.before.unshift('i18n');
    },

    initialize() {
      const routes = get('plugins.content-manager.config.routes', strapi);
      const routesToAddPolicyTo = routes.filter(
        route =>
          isMatch({ method: 'POST', path: '/collection-types/:model' }, route) ||
          isMatch({ method: 'PUT', path: '/single-types/:model' }, route)
      );

      routesToAddPolicyTo.forEach(route => {
        const policies = getOr([], 'config.policies', route).concat(
          'plugins::i18n.validateLocaleCreation'
        );
        _.set(route, 'config.policies', policies);
      });
    },
  };
};
