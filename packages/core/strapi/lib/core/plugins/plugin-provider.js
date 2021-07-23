'use strict';

const { join } = require('path');
const { existsSync } = require('fs');
const { flatMap, getOr, mapValues, reduce, split } = require('lodash/fp');
const loadConfigFile = require('../app-configuration/load-config-file');
const getEnabledPlugins = require('./get-enabled-plugins');
const createPlugin = require('./create-plugin');

const parseUID = split('.');

const createPluginProvider = strapi => {
  let loaded = false;
  const plugins = {};
  const userPluginConfigPath = join(strapi.dir, 'config', 'plugins.js');
  const userPluginsConfig = existsSync(userPluginConfigPath)
    ? loadConfigFile(userPluginConfigPath)
    : {};
  const pluginProvider = {};

  Object.assign(pluginProvider, {
    async load() {
      if (loaded) {
        throw new Error('This plugin provider has already been loaded.');
      }
      const enabledPlugins = await getEnabledPlugins(strapi);
      for (const pluginName in enabledPlugins) {
        const enabledPlugin = enabledPlugins[pluginName];
        const userPluginConfig = getOr({}, `${pluginName}.config`, userPluginsConfig);
        plugins[pluginName] = await createPlugin(
          strapi,
          pluginName,
          enabledPlugin,
          userPluginConfig
        );
      }
      loaded = true;
    },
    get(pluginName) {
      return plugins[pluginName];
    },
    getAll() {
      return plugins;
    },
    async bootstrap() {
      for (const plugin of Object.values(plugins)) {
        await plugin.bootstrap();
      }
    },
    async register() {
      for (const plugin of Object.values(plugins)) {
        await plugin.register();
      }
    },
    async destroy() {
      for (const plugin of Object.values(plugins)) {
        await plugin.destroy();
      }
    },
    service: (...args) => this.services.get(...args),
    services: {
      has(uid) {
        const [pluginName, service] = parseUID(uid);
        const plugin = pluginProvider.get(pluginName);
        return plugin && plugin.services.has(service);
      },
      get(uid) {
        const [pluginName, service] = parseUID(uid);
        const plugin = pluginProvider.get(pluginName);
        return plugin ? plugin.services.get(service) : undefined;
      },
      getAll() {
        return mapValues(plugin => plugin.services.getAll())(plugins);
      },
      get size() {
        return reduce((count, plugin) => count + plugin.size(), 0)(plugins);
      },
    },
    contentType: (...args) => this.contentTypes.get(...args),
    contentTypes: {
      has(uid) {
        const [pluginName, contentType] = parseUID(uid);
        const plugin = pluginProvider.get(pluginName);

        return plugin && plugin.contentTypes.has(contentType);
      },
      get(uid) {
        const [pluginName, contentType] = parseUID(uid);
        const plugin = pluginProvider.get(pluginName);

        return plugin ? plugin.contentTypes.get(contentType) : undefined;
      },
      getAll() {
        return flatMap(p => p.contentTypes.getAll(), plugins);
      },
      forEach(fn) {
        this.getAll().forEach(fn);
      },
      get size() {
        return this.getAll().length;
      },
    },
    policy: (...args) => this.policies.get(...args),
    policies: {
      has(uid) {
        const [pluginName, policy] = parseUID(uid);
        const plugin = pluginProvider.get(pluginName);

        return plugin && plugin.policies.has(policy);
      },
      get(uid) {
        const [pluginName, policy] = parseUID(uid);
        const plugin = pluginProvider.get(pluginName);

        return plugin ? plugin.policies.get(policy) : undefined;
      },
      getAll() {
        return mapValues(plugin => plugin.policies.getAll())(plugins);
      },
      get size() {
        return this.keys().length;
      },
    },
  });

  return pluginProvider;
};

module.exports = createPluginProvider;
