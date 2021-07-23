'use strict';

const { dirname, join } = require('path');
const { statSync, existsSync } = require('fs');
const _ = require('lodash');
const { get, has, pick, pickBy, defaultsDeep, map, prop, pipe } = require('lodash/fp');
const { nameToSlug } = require('@strapi/utils');
const loadConfigFile = require('../app-configuration/load-config-file');

const isStrapiPlugin = info => get('strapi.kind', info) === 'plugin';

const toDetailedDeclaration = declaration => {
  if (typeof declaration === 'boolean') {
    return { enabled: declaration };
  }

  let detailedDeclaration = pick(['enabled'], declaration);
  if (has('config', declaration)) {
    detailedDeclaration.userConfig = declaration.config;
  }
  if (has('resolve', declaration)) {
    let pathToPlugin = '';
    try {
      pathToPlugin = dirname(require.resolve(declaration.resolve));
    } catch (e) {
      if (existsSync(declaration.resolve) && statSync(declaration.resolve).isDirectory()) {
        pathToPlugin = declaration.resolve;
      } else {
        throw new Error(`${declaration.resolve} couldn't be resolved`);
      }
    }

    detailedDeclaration.pathToPlugin = pathToPlugin;
  }
  return detailedDeclaration;
};

const getEnabledPlugins = async strapi => {
  const installedPlugins = {};
  for (const dep in strapi.config.get('info.dependencies', {})) {
    const packagePath = join(dep, 'package.json');
    const packageInfo = require(packagePath);

    if (isStrapiPlugin(packageInfo)) {
      const cleanPluginName = nameToSlug(packageInfo.strapi.name);
      installedPlugins[cleanPluginName] = toDetailedDeclaration({
        enabled: true,
        resolve: packagePath,
      });
    }
  }

  const declaredPlugins = {};
  const userPluginConfigPath = join(strapi.dir, 'config', 'plugins.js');
  const userPluginsConfig = existsSync(userPluginConfigPath)
    ? loadConfigFile(userPluginConfigPath)
    : {};
  _.forEach(userPluginsConfig, (declaration, pluginName) => {
    const cleanPluginName = nameToSlug(pluginName);
    declaredPlugins[cleanPluginName] = toDetailedDeclaration(declaration);
  });

  const declaredPluginsResolves = map(prop('pathToPlugin'), declaredPlugins);
  const installedPluginsNotAlreadyUsed = pickBy(
    p => !declaredPluginsResolves.includes(p.pathToPlugin),
    installedPlugins
  );
  const enabledPlugins = pipe(
    defaultsDeep(installedPluginsNotAlreadyUsed),
    pickBy(p => p.enabled)
  )(declaredPlugins);

  return enabledPlugins;
};

module.exports = getEnabledPlugins;
