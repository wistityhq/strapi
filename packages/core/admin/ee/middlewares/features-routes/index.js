'use strict';

// eslint-disable-next-line node/no-extraneous-require
const { features } = require('@strapi/strapi/lib/utils/ee');
const routes = require('./routes');

module.exports = strapi => ({
  beforeInitialize() {
    strapi.config.middleware.load.before.unshift('features-routes'); // TODO
  },

  initialize() {
    loadFeaturesRoutes();
  },
});

const loadFeaturesRoutes = () => {
  for (const [feature, getFeatureRoutes] of Object.entries(routes)) {
    if (features.isEnabled(feature)) {
      strapi.admin.config.routes.push(...getFeatureRoutes); // TODO
    }
  }
};
