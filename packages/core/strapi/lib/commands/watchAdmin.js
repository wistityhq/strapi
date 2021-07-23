'use strict';

// eslint-disable-next-line node/no-extraneous-require
const strapiAdmin = require('@strapi/admin');
const { getOr } = require('lodash/fp');
const { getConfigUrls, getAbsoluteServerUrl } = require('@strapi/utils');
const loadConfiguration = require('../core/app-configuration');
const ee = require('../utils/ee');
const addSlash = require('../utils/addSlash');

module.exports = async function({ browser }) {
  const dir = process.cwd();

  const config = loadConfiguration(dir);

  const { adminPath } = getConfigUrls(config.server, true);

  const adminPort = getOr(8000, 'server.admin.port')(config);
  const adminHost = getOr('localhost', 'server.admin.host')(config);
  const adminWatchIgnoreFiles = getOr([], 'server.admin.watchIgnoreFiles')(config);

  ee({ dir });

  strapiAdmin.watchAdmin({
    dir,
    port: adminPort,
    host: adminHost,
    browser,
    options: {
      backend: getAbsoluteServerUrl(config, true),
      adminPath: addSlash(adminPath),
      watchIgnoreFiles: adminWatchIgnoreFiles,
      features: ee.isEE ? ee.features.getEnabled() : [],
    },
  });
};
