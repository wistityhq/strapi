'use strict';

const _ = require('lodash');

const findPackagePath = require('../../load/package-path');
const loadFiles = require('../../load/load-files');
const loadConfig = require('../../load/load-config-files');

const mergeRoutes = (a, b, key) =>
  _.isArray(a) && _.isArray(b) && key === 'routes' ? a.concat(b) : undefined;

module.exports = async strapi => {
  const adminPath = findPackagePath('@strapi/admin');
  const [files, config] = await Promise.all([
    loadFiles(adminPath, '!(config|node_modules|tests|ee|scripts)/*.*(js|json)'),
    loadConfig(adminPath),
  ]);

  // set admin config in strapi.config.server.admin
  const userAdminConfig = strapi.config.get('server.admin');
  strapi.config.set('server.admin', _.merge(config.config, userAdminConfig));

  // load ee files if they exist
  let eeFiles = {};
  let eeConfig = {};

  if (process.env.STRAPI_DISABLE_EE !== 'true' && strapi.EE) {
    const eeAdminPath = `${adminPath}/ee`;
    [eeFiles, eeConfig] = await Promise.all([
      loadFiles(eeAdminPath, '!(config|tests|test)/*.*(js|json)'),
      loadConfig(eeAdminPath),
    ]);
  }

  return _.mergeWith({}, files, eeFiles, config, eeConfig, mergeRoutes);
};
