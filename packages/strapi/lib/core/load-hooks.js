'use strict';

// Dependencies.
const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const glob = require('../load/glob');
const findPackagePath = require('../load/package-path');
const getSupportedFileExtensions = require('../utils/getSupportedFileExtensions');

/**
 * Load hooks
 */
module.exports = async function(config) {
  const { installedHooks, installedPlugins, appPath } = config;
  let hooks = {};
  await Promise.all([
    loadHookDependencies(installedHooks, hooks, getSupportedFileExtensions(config)),
    // local middleware
    loadLocalHooks(appPath, hooks),
    // admin hooks
    loadAdminHooks(hooks),
    // plugins middlewares
    loadPluginsHooks(installedPlugins, hooks),
    // local plugin middlewares
    loadLocalPluginsHooks(appPath, hooks),
  ]);

  return hooks;
};

const loadHooksInDir = async (dir, hooks, fileExtensions) => {
  const files = await glob(`*/*(index|defaults).*(${fileExtensions})`, {
    cwd: dir,
  });

  files.forEach(f => {
    const name = f.split('/')[0];
    mountHooks(name, [path.resolve(dir, f)], hooks);
  });
};

const loadLocalHooks = (appPath, hooks, fileExtensions) =>
  loadHooksInDir(path.resolve(appPath, 'hooks'), hooks, fileExtensions);

const loadPluginsHooks = async (plugins, hooks, fileExtensions) => {
  for (let pluginName of plugins) {
    const dir = path.resolve(findPackagePath(`strapi-plugin-${pluginName}`), 'hooks');
    await loadHooksInDir(dir, hooks, fileExtensions);
  }
};

const loadAdminHooks = async (hooks, fileExtensions) => {
  const hooksDir = 'hooks';
  const dir = path.resolve(findPackagePath('strapi-admin'), hooksDir);
  await loadHooksInDir(dir, hooks, fileExtensions);

  // load ee admin hooks if they exist
  if (process.env.STRAPI_DISABLE_EE !== 'true' && strapi.EE) {
    await loadHooksInDir(`${dir}/../ee/${hooksDir}`, hooks, fileExtensions);
  }
};

const loadLocalPluginsHooks = async (appPath, hooks, fileExtensions) => {
  const pluginsDir = path.resolve(appPath, 'plugins');
  if (!fs.existsSync(pluginsDir)) return;

  const pluginsNames = await fs.readdir(pluginsDir);

  for (let pluginName of pluginsNames) {
    // ignore files
    const stat = await fs.stat(path.resolve(pluginsDir, pluginName));
    if (!stat.isDirectory()) continue;

    const dir = path.resolve(pluginsDir, pluginName, 'hooks');
    await loadHooksInDir(dir, hooks, fileExtensions);
  }
};

const loadHookDependencies = async (installedHooks, hooks, fileExtensions) => {
  for (let hook of installedHooks) {
    const hookDir = path.dirname(require.resolve(`strapi-hook-${hook}`));

    const files = await glob(`*(index|defaults).*(${fileExtensions})`, {
      cwd: hookDir,
      absolute: true,
    });

    mountHooks(hook, files, hooks);
  }
};

const mountHooks = (name, files, hooks) => {
  files.forEach(file => {
    hooks[name] = hooks[name] || { loaded: false };

    let dependencies = [];
    try {
      dependencies = _.get(require(`strapi-hook-${name}/package.json`), 'strapi.dependencies', []);
    } catch (err) {
      // Silent
    }

    if (_.endsWith(file, 'index.js') && !hooks[name].load) {
      Object.defineProperty(hooks[name], 'load', {
        configurable: false,
        enumerable: true,
        get: () => require(file)(strapi),
      });
      hooks[name].dependencies = dependencies;
      return;
    }

    if (_.endsWith(file, 'defaults.json')) {
      hooks[name].defaults = require(file);
      return;
    }
  });
};
