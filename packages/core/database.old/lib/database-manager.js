'use strict';

const _ = require('lodash');

const { createQuery } = require('./queries');
const createConnectorRegistry = require('./connector-registry');
const constants = require('./constants');
const { validateModelSchemas } = require('./validation');
const createMigrationManager = require('./migration-manager');
const createLifecycleManager = require('./lifecycle-manager');

class DatabaseManager {
  constructor(strapi) {
    this.strapi = strapi;

    this.initialized = false;

    this.connectors = createConnectorRegistry({
      connections: strapi.config.get('database.connections'),
      defaultConnection: strapi.config.get('database.defaultConnection'),
    });

    this.queries = new Map();
    this.models = new Map();

    this.migrations = createMigrationManager(this);
    this.lifecycles = createLifecycleManager();
  }

  async initialize() {
    if (this.initialized === true) {
      throw new Error('Database manager already initialized');
    }

    this.initialized = true;

    this.connectors.load();

    validateModelSchemas({ strapi: this.strapi, manager: this });

    this.initializeModelsMap();

    await this.connectors.initialize();

    return this;
  }

  async destroy() {
    await Promise.all(this.connectors.getAll().map(connector => connector.destroy()));
  }

  initializeModelsMap() {
    Object.keys(this.strapi.models).forEach(modelKey => {
      const model = this.strapi.models[modelKey];
      this.models.set(model.uid, model);
    });

    Object.keys(this.strapi.admin.models).forEach(modelKey => {
      const model = this.strapi.admin.models[modelKey];
      this.models.set(model.uid, model);
    });

    Object.keys(this.strapi.plugins).forEach(pluginKey => {
      Object.keys(this.strapi.plugins[pluginKey].models || {}).forEach(modelKey => {
        const model = this.strapi.plugins[pluginKey].models[modelKey];
        this.models.set(model.uid, model);
      });
    });
  }

  query(entity, plugin) {
    if (!entity) {
      throw new Error(`argument entity is required`);
    }

    const model = this.getModel(entity, plugin);

    if (!model) {
      throw new Error(`The model ${entity} can't be found.`);
    }

    if (this.queries.has(model.uid)) {
      return this.queries.get(model.uid);
    }

    const connectorQuery = this.connectors
      .get(model.orm)
      .queries({ model, modelKey: model.modelName, strapi });

    const query = createQuery({
      connectorQuery,
      model,
    });

    this.queries.set(model.uid, query);
    return query;
  }

  getModelFromStrapi(name, plugin) {
    const key = _.toLower(name);
    if (plugin === 'admin') {
      return _.get(strapi.admin, ['models', key]);
    }

    if (plugin) {
      return _.get(strapi.plugins, [plugin, 'models', key]);
    }

    return _.get(strapi, ['models', key]) || _.get(strapi, ['components', key]);
  }

  getModel(name, plugin) {
    const key = _.toLower(name);

    if (this.models.has(key)) {
      const { modelName, plugin: pluginName } = this.models.get(key);
      return this.getModelFromStrapi(modelName, pluginName);
    } else {
      return this.getModelFromStrapi(key, plugin);
    }
  }

  getModelByAssoc(assoc) {
    return this.getModel(assoc.collection || assoc.model, assoc.plugin);
  }

  getModelByCollectionName(collectionName) {
    return Array.from(this.models.values()).find(model => {
      return model.collectionName === collectionName;
    });
  }

  getModelByGlobalId(globalId) {
    return Array.from(this.models.values()).find(model => {
      return model.globalId === globalId;
    });
  }

  getModelsByAttribute(attr) {
    if (attr.type === 'component') {
      return [this.getModel(attr.component)];
    }
    if (attr.type === 'dynamiczone') {
      return attr.components.map(compoName => this.getModel(compoName));
    }
    if (attr.model || attr.collection) {
      return [this.getModelByAssoc(attr)];
    }

    return [];
  }

  getModelsByPluginName(pluginName) {
    if (!pluginName) {
      return strapi.models;
    }
    return pluginName === 'admin' ? strapi.admin.models : strapi.plugins[pluginName].models;
  }

  getReservedNames() {
    return {
      models: constants.RESERVED_MODEL_NAMES,
      attributes: [
        ...constants.RESERVED_ATTRIBUTE_NAMES,
        ...(strapi.db.connectors.default.defaultTimestamps || []),
      ],
    };
  }
}

function createDatabaseManager(strapi) {
  return new DatabaseManager(strapi);
}

module.exports = {
  createDatabaseManager,
};
