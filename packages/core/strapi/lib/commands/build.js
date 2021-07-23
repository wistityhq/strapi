'use strict';
const { green } = require('chalk');

// eslint-disable-next-line node/no-extraneous-require
const strapiAdmin = require('@strapi/admin');
const { getConfigUrls } = require('@strapi/utils');
const loadConfiguration = require('../core/app-configuration');
const ee = require('../utils/ee');

const addSlash = require('../utils/addSlash');
/**
 * `$ strapi build`
 */
module.exports = async ({ clean, optimization }) => {
  const dir = process.cwd();
  const config = loadConfiguration(dir);

  const { serverUrl, adminPath } = getConfigUrls(config.server, true);

  console.log(`Building your admin UI with ${green(config.environment)} configuration ...`);

  if (clean) {
    await strapiAdmin.clean({ dir });
  }

  ee({ dir });

  return strapiAdmin
    .build({
      dir,
      // front end build env is always production for now
      env: 'production',
      optimize: optimization,
      options: {
        backend: serverUrl,
        adminPath: addSlash(adminPath),
      },
    })
    .then(() => {
      process.exit();
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
};
