'use strict';

const _ = require('lodash');
const { mapKeys, toLower } = require('lodash/fp');
const { getConfigUrls } = require('@strapi/utils');
const { createContentType } = require('../domain/content-type');

const { createCoreApi } = require('../../core-api');

module.exports = function(strapi) {
  strapi.contentTypes = {};

  // Set models.
  strapi.models = Object.keys(strapi.api || []).reduce((acc, apiName) => {
    const api = strapi.api[apiName];

    for (let modelName in api.models) {
      let model = strapi.api[apiName].models[modelName];

      // mutate model
      const ct = {
        schema: model,
        actions: {},
        lifecycles: {},
      };
      ct.schema.info = {};
      ct.schema.info.displayName = _.camelCase(modelName);
      ct.schema.info.singularName = _.camelCase(modelName);
      ct.schema.info.pluralName = `${_.camelCase(modelName)}s`;

      const createdContentType = createContentType(ct, { apiName });
      Object.assign(model, createdContentType.schema);
      strapi.contentTypes[model.uid] = model;

      const { service, controller } = createCoreApi({ model, api, strapi });

      _.set(strapi.api[apiName], ['services', modelName], service);
      _.set(strapi.api[apiName], ['controllers', modelName], controller);

      acc[modelName] = model;
    }
    return acc;
  }, {});

  // Set controllers.
  strapi.controllers = Object.keys(strapi.api || []).reduce((acc, key) => {
    for (let index in strapi.api[key].controllers) {
      let controller = strapi.api[key].controllers[index];
      acc[index] = controller;
    }

    return acc;
  }, {});

  // Set services.
  strapi.services = Object.keys(strapi.api || []).reduce((acc, key) => {
    for (let index in strapi.api[key].services) {
      acc[index] = strapi.api[key].services[index];
    }

    return acc;
  }, {});

  // Set routes.
  strapi.config.routes = Object.keys(strapi.api || []).reduce((acc, key) => {
    return acc.concat(_.get(strapi.api[key], 'config.routes') || {});
  }, []);

  // Init admin models.
  Object.keys(strapi.admin.models || []).forEach(modelName => {
    let model = strapi.admin.models[modelName];

    // mutate model
    const ct = { schema: model, actions: {}, lifecycles: {} };
    ct.schema.info = {};
    ct.schema.info.displayName = _.camelCase(modelName);
    ct.schema.info.singularName = _.camelCase(modelName);
    ct.schema.info.pluralName = `${_.camelCase(modelName)}s`;

    const createdContentType = createContentType(ct);

    Object.assign(model, createdContentType.schema);
    strapi.contentTypes[model.uid] = model;
  });

  // Object.keys(strapi.plugins).forEach(pluginName => {
  //   let plugin = strapi.plugins[pluginName];
  // Object.assign(plugin, {
  //   controllers: plugin.controllers || [],
  //   services: plugin.services || [],
  //   models: plugin.models || [],
  // });

  // Object.keys(plugin.models || []).forEach(modelName => {
  //   let model = plugin.models[modelName];

  //   // mutate model
  //   contentTypesUtils.createContentType(model, { modelName, defaultConnection }, { pluginName });

  //   strapi.contentTypes[model.uid] = model;
  // });

  for (const plugin in strapi.container.plugins.getAll()) {
    strapi.plugins[plugin].models = {};
  }

  strapi.container.plugins.contentTypes.forEach(ct => {
    strapi.contentTypes[ct.schema.uid] = ct.schema;
    strapi.plugins[ct.schema.plugin] = strapi.plugins[ct.schema.plugin] || {};
    strapi.plugins[ct.schema.plugin][ct.schema.modelName] = ct.schema;
    strapi.plugins[ct.schema.plugin].models[ct.schema.modelName] = ct.schema;
  });

  strapi.plugins.i18n;
  strapi.plugins.get;

  const policies = strapi.container.plugins.policies.getAll();
  Object.assign(strapi.container.plugins, policies);
  for (const plugin in policies) {
    strapi.plugins[plugin].config = strapi.plugins[plugin].config || {};
    strapi.plugins[plugin].config.policies = strapi.plugins[plugin].config.policies || {};
    Object.assign(strapi.plugins[plugin].config.policies, mapKeys(toLower, policies[plugin]));
  }

  // Preset config in alphabetical order.
  strapi.config.middleware.settings = Object.keys(strapi.middleware).reduce((acc, current) => {
    // Try to find the settings in the current environment, then in the main configurations.
    const currentSettings = _.merge(
      _.cloneDeep(_.get(strapi.middleware[current], ['defaults', current], {})),
      strapi.config.get(['middleware', 'settings', current], {})
    );

    acc[current] = !_.isObject(currentSettings) ? {} : currentSettings;

    // Ensure that enabled key exist by forcing to false.
    _.defaults(acc[current], { enabled: false });

    return acc;
  }, {});

  strapi.config.hook.settings = Object.keys(strapi.hook).reduce((acc, current) => {
    // Try to find the settings in the current environment, then in the main configurations.
    const currentSettings = _.merge(
      _.cloneDeep(_.get(strapi.hook[current], ['defaults', current], {})),
      strapi.config.get(['hook', 'settings', current], {})
    );

    acc[current] = !_.isObject(currentSettings) ? {} : currentSettings;

    // Ensure that enabled key exist by forcing to false.
    _.defaults(acc[current], { enabled: false });

    return acc;
  }, {});

  // default settings
  strapi.config.port = strapi.config.get('server.port') || strapi.config.port;
  strapi.config.host = strapi.config.get('server.host') || strapi.config.host;

  const { serverUrl, adminUrl, adminPath } = getConfigUrls(strapi.config.get('server'));

  strapi.config.server = strapi.config.server || {};
  strapi.config.server.url = serverUrl;
  strapi.config.admin.url = adminUrl;
  strapi.config.admin.path = adminPath;

  // check if we should serve admin panel
  const shouldServeAdmin = strapi.config.get(
    'server.admin.serveAdminPanel',
    strapi.config.get('serveAdminPanel')
  );

  if (!shouldServeAdmin) {
    strapi.config.serveAdminPanel = false;
  }
};
