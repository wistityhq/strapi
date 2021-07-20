'use strict';

const { join } = require('path');
const { existsSync } = require('fs-extra');
const _ = require('lodash');
const findPackagePath = require('../load/package-path');
const loadFiles = require('../load/load-files');
const loadConfig = require('../load/load-config-files');
const getSupportedFileExtensions = require('../utils/getSupportedFileExtensions');

module.exports = async ({ dir, config }) => {
  const localPlugins = await loadLocalPlugins({ dir, config });
  const plugins = await loadPlugins({
    installedPlugins: config.installedPlugins,
    config,
  });

  const pluginsIntersection = _.intersection(Object.keys(localPlugins), Object.keys(plugins));

  if (pluginsIntersection.length > 0) {
    throw new Error(
      `You have some local plugins with the same name as npm installed plugins:\n${pluginsIntersection
        .map(p => `- ${p}`)
        .join('\n')}`
    );
  }

  // check for conflicts
  return _.merge(plugins, localPlugins);
};

const loadLocalPlugins = async ({ dir, config }) => {
  const pluginsDir = join(dir, 'plugins');
  const fileExtensions = getSupportedFileExtensions(config);
  if (!existsSync(pluginsDir)) return {};

  const [files, configs] = await Promise.all([
    loadFiles(pluginsDir, `{*/!(config)/*.*(${fileExtensions}),*/package.json}`),
    loadConfig(pluginsDir, `*/config/**/*.+(${fileExtensions})`),
  ]);
  const userConfigs = Object.keys(files).reduce((acc, plugin) => {
    acc[plugin] = { config: config.get(['plugins', plugin], {}) };
    return acc;
  }, {});
  return _.merge(files, configs, userConfigs);
};

const loadPlugins = async ({ installedPlugins, config }) => {
  let plugins = {};

  for (let plugin of installedPlugins) {
    const pluginPath = findPackagePath(`strapi-plugin-${plugin}`);

    const files = await loadFiles(
      pluginPath,
      `{!(config|node_modules|tests)/*.*(${getSupportedFileExtensions(config)}),package.json}`
    );

    const { config: pluginConfig } = await loadConfig(pluginPath);

    const userConfig = config.get(['plugins', plugin], {});

    const mergedConfig = _.merge(pluginConfig, userConfig);

    _.set(plugins, plugin, _.assign({}, files, { config: mergedConfig }));
  }

  return plugins;
};
