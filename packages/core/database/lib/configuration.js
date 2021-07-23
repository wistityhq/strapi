'use strict';
const { prop, defaultsDeep } = require('lodash/fp');

/*
config/database.js

{
  connector: '',
  connection: {},
  migration: {},
  seed: {},
  schema: {
    autoSync: true,
    forceSync: true
  }
}

*/

class Configuration {
  constructor(config) {
    this.config = config;
  }

  static from(config) {
    if (config instanceof Configuration) {
      return config;
    }

    return new Configuration(defaultsDeep(config, Configuration.defaults));
  }

  get(path) {
    return prop(path, this.config);
  }
}

Configuration.defaults = {
  connector: '@strapi/connector-sql',
  migration: {
    //
  },
  seed: {
    //
  },
  models: [],
};

module.exports = Configuration;
