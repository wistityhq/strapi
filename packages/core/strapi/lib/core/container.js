'use strict';

const { split } = require('lodash/fp');
const createPluginProvider = require('./plugins/plugin-provider');

const parseNamespace = split('::');

const parseUIDPath = split('.');

const createContainer = strapi => {
  let loaded = false;
  const container = {};
  const pluginProvider = createPluginProvider(strapi);

  Object.assign(container, {
    async load() {
      if (loaded) {
        throw new Error('This plugin provider has already been loaded.');
      }
      await pluginProvider.load(this);
    },
    config: strapi.config,
    plugin: pluginProvider.get,
    plugins: pluginProvider,
    async bootstrap() {
      await this.plugins.bootstrap();
    },
    async register() {
      await this.plugins.register();
    },
    contentType: (...args) => this.contentTypes.get(...args),
    contentTypes: {
      has(uid) {
        const [namespace, path] = parseNamespace(uid);
        switch (namespace) {
          case 'plugins': {
            const [plugin, contentType] = parseUIDPath(path);
            return container.plugin(plugin).contentTypes.has(contentType);
          }
          default:
            return false;
        }
      },
      get(uid) {
        const [namespace, path] = parseNamespace(uid);
        switch (namespace) {
          case 'plugins': {
            const [plugin, contentType] = parseUIDPath(path);
            return container.plugin(plugin).contentTypes.get(contentType);
          }
          default:
            return false;
        }
      },
      getAll() {
        const pluginContentTypes = container.plugins.contentTypes.getAll();
        return [...pluginContentTypes];
      },
      forEach(fn) {
        container.plugins.contentTypes.forEach(fn);
      },
      get size() {
        return this.getAll().length;
      },
    },
    service: (...args) => this.services.get(...args),
    services: {
      has(uid) {
        const [namespace, path] = parseNamespace(uid);
        switch (namespace) {
          case 'plugins': {
            const [plugin, service] = parseUIDPath(path);
            return container.plugin(plugin).services.has(service);
          }
          default:
            return false;
        }
      },
      get(uid) {
        const [namespace, path] = parseNamespace(uid);
        switch (namespace) {
          case 'plugins': {
            const [plugin, service] = parseUIDPath(path);
            return container.plugin(plugin).services.get(service);
          }
          default:
            return false;
        }
      },
      getAll() {
        return {
          plugins: container.plugins.services.getAll(),
        };
      },
      get size() {
        const pluginServicesCount = container.plugins.services.size();

        return pluginServicesCount;
      },
    },
    policy: (...args) => this.policies.get(...args),
    policies: {
      has(uid) {
        const [namespace, path] = parseNamespace(uid);
        switch (namespace) {
          case 'plugins': {
            const [plugin, policy] = parseUIDPath(path);
            return container.plugin(plugin).policies.has(policy);
          }
          default:
            return false;
        }
      },
      get(uid) {
        const [namespace, path] = parseNamespace(uid);
        switch (namespace) {
          case 'plugins': {
            const [plugin, policy] = parseUIDPath(path);
            return container.plugin(plugin).policies.get(policy);
          }
          default:
            return false;
        }
      },
      getAll() {
        return {
          plugins: container.plugins.policies.getAll(),
        };
      },
      get size() {
        const pluginServicesCount = container.plugins.services.size();

        return pluginServicesCount;
      },
    },
  });

  return container;
};

module.exports = createContainer;
