'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const path = require('path');
const fs = require('fs');
const url = require('url');
const _ = require('lodash');
const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

const Mongoose = mongoose.Mongoose;

const relations = require('./relations');
const buildQuery = require('./buildQuery');
const getQueryParams = require('./get-query-params');
const mountModels = require('./mount-models');
const queries = require('./queries');
const registerCoreMigrations = require('./migrations');

/**
 * Mongoose hook
 */

const defaults = {
  defaultConnection: 'default',
  host: 'localhost',
  port: 27017,
  database: 'strapi',
  authenticationDatabase: '',
  ssl: false,
  debug: false,
};

const isMongooseConnection = ({ connector }) => connector === 'mongoose';

const createConnectionURL = opts => {
  const { protocol, auth, host, port } = opts;

  return {
    toString() {
      return `${protocol}://${auth}${host}${port}/`;
    },
  };
};

module.exports = function(strapi) {
  const { connections } = strapi.config;
  const mongooseConnections = Object.keys(connections).filter(key =>
    isMongooseConnection(connections[key])
  );

  function initialize() {
    registerCoreMigrations();

    const connectionsPromises = mongooseConnections.map(async connectionName => {
      const connection = connections[connectionName];
      const instance = new Mongoose();

      _.defaults(connection.settings, strapi.config.hook.settings.mongoose);

      const {
        uri,
        host,
        port,
        username,
        password,
        database,
        srv,
        useUnifiedTopology,
      } = connection.settings;

      // eslint-disable-next-line node/no-deprecated-api
      const uriOptions = uri ? url.parse(uri, true).query : {};
      const { authenticationDatabase, ssl, debug } = _.defaults(
        connection.options,
        uriOptions,
        strapi.config.hook.settings.mongoose
      );
      const isSrv = srv === true || srv === 'true';

      // Connect to mongo database
      const connectOptionsDefaults = {};

      if (!_.isEmpty(username)) {
        connectOptionsDefaults.user = username;

        if (!_.isEmpty(password)) {
          connectOptionsDefaults.pass = password;
        }
      }

      if (!_.isEmpty(authenticationDatabase)) {
        connectOptionsDefaults.authSource = authenticationDatabase;
      }

      connectOptionsDefaults.ssl = ssl === true || ssl === 'true';
      connectOptionsDefaults.useNewUrlParser = true;
      connectOptionsDefaults.dbName = database;
      connectOptionsDefaults.useCreateIndex = true;
      connectOptionsDefaults.useUnifiedTopology = useUnifiedTopology || true;

      const connectOptions = {
        ...connectOptionsDefaults,
        ...connection.options
      }

      try {
        const connectionURL = createConnectionURL({
          protocol: `mongodb${isSrv ? '+srv' : ''}`,
          port: isSrv ? '' : `:${port}`,
          host,
          auth: username ? `${username}:${encodeURIComponent(password)}@` : '',
        });

        const connectionString = uri || connectionURL.toString();

        await instance.connect(connectionString, connectOptions);
      } catch (error) {
        const err = new Error(`Error connecting to the Mongo database. ${error.message}`);
        delete err.stack;
        throw err;
      }

      try {
        const { version } = await instance.connection.db.admin().serverInfo();
        instance.mongoDBVersion = version;
      } catch {
        instance.mongoDBVersion = null;
      }

      const initFunctionPath = path.resolve(
        strapi.config.appPath,
        'config',
        'functions',
        'mongoose.js'
      );

      if (fs.existsSync(initFunctionPath)) {
        require(initFunctionPath)(instance, connection);
      }

      instance.set('debug', debug === true || debug === 'true');
      instance.set('useFindAndModify', false);

      const ctx = {
        instance,
        connection,
      };

      _.set(strapi, `connections.${connectionName}`, instance);

      return Promise.all([
        mountComponents(connectionName, ctx),
        mountApis(connectionName, ctx),
        mountAdmin(connectionName, ctx),
        mountPlugins(connectionName, ctx),
      ]);
    });

    return Promise.all(connectionsPromises);
  }

  function mountComponents(connectionName, ctx) {
    const options = {
      models: _.pickBy(strapi.components, ({ connection }) => connection === connectionName),
      target: strapi.components,
    };

    return mountModels(options, ctx);
  }

  function mountApis(connectionName, ctx) {
    const options = {
      models: _.pickBy(strapi.models, ({ connection }) => connection === connectionName),
      target: strapi.models,
    };

    return mountModels(options, ctx);
  }

  function mountAdmin(connectionName, ctx) {
    const options = {
      models: _.pickBy(strapi.admin.models, ({ connection }) => connection === connectionName),
      target: strapi.admin.models,
    };

    return mountModels(options, ctx);
  }

  function mountPlugins(connectionName, ctx) {
    return Promise.all(
      Object.keys(strapi.plugins).map(name => {
        const plugin = strapi.plugins[name];
        return mountModels(
          {
            models: _.pickBy(plugin.models, ({ connection }) => connection === connectionName),
            target: plugin.models,
          },
          ctx
        );
      })
    );
  }

  async function destroy() {
    await Promise.all(
      mongooseConnections.map(connName => {
        const mongooseConnection = strapi.connections[connName];

        if (
          mongooseConnection instanceof Mongoose &&
          mongooseConnection.connection.readyState === 1
        ) {
          mongooseConnection.disconnect();
        }
      })
    );
  }

  return {
    defaults,
    initialize,
    getQueryParams,
    destroy,
    buildQuery,
    queries,
    ...relations,
    get defaultTimestamps() {
      return ['createdAt', 'updatedAt'];
    },
  };
};
