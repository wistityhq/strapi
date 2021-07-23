'use strict';

const os = require('os');
const path = require('path');
const _ = require('lodash');
const { omit } = require('lodash/fp');
const dotenv = require('dotenv');

dotenv.config({ path: process.env.ENV_PATH });

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const getPrefixedDeps = require('../../utils/get-prefixed-dependencies');
// const loadPolicies = require('../load-policies');
// const loadFunctions = require('../load-functions');
const loadConfigDir = require('./config-loader');

const { version: strapiVersion } = require(path.join(__dirname, '../../../package.json'));

const CONFIG_PATHS = {
  admin: 'admin',
  api: 'api',
  config: 'config',
  controllers: 'controllers',
  models: 'models',
  plugins: 'plugins',
  policies: 'policies',
  tmp: '.tmp',
  services: 'services',
  static: 'public',
  validators: 'validators',
  views: 'views',
};

const defaultConfig = {
  server: {
    host: process.env.HOST || os.hostname() || 'localhost',
    port: process.env.PORT || 1337,
    proxy: false,
    cron: { enabled: false },
    admin: { autoOpen: false },
  },
  admin: {},
  middleware: {
    timeout: 1000,
    load: {
      before: ['responseTime', 'logger', 'cors', 'responses', 'gzip'],
      order: [],
      after: ['parser', 'router'],
    },
    settings: {},
  },
  hook: {
    timeout: 1000,
    load: {
      before: ['responseTime', 'logger', 'cors', 'responses', 'gzip'],
      order: [],
      after: ['parser', 'router'],
    },
    settings: {},
  },
};

module.exports = (dir, initialConfig = {}) => {
  const { autoReload = false, serveAdminPanel = true } = initialConfig;

  const pkgJSON = require(path.resolve(dir, 'package.json'));

  const configDir = path.resolve(dir || process.cwd(), 'config');

  const rootConfig = {
    launchedAt: Date.now(),
    appPath: dir,
    paths: CONFIG_PATHS,
    serveAdminPanel,
    autoReload,
    environment: process.env.NODE_ENV,
    uuid: _.get(pkgJSON, 'strapi.uuid'),
    packageJsonStrapi: _.omit(_.get(pkgJSON, 'strapi', {}), 'uuid'),
    info: {
      ...pkgJSON,
      strapi: strapiVersion,
    },
    // installedPlugins: getPrefixedDeps('@strapi/plugin', pkgJSON),
    installedMiddlewares: getPrefixedDeps('@strapi/middleware', pkgJSON),
    installedHooks: getPrefixedDeps('@strapi/hook', pkgJSON),
    // installedProviders: getPrefixedDeps('@strapi/provider', pkgJSON),
  };

  const baseConfig = omit('plugins', loadConfigDir(configDir)); // plugin config will be loaded later

  const envDir = path.resolve(configDir, 'env', process.env.NODE_ENV);
  const envConfig = loadConfigDir(envDir);

  return _.merge(rootConfig, defaultConfig, baseConfig, envConfig);
};
