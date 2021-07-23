'use strict';

const knex = require('knex');

const { getDialect } = require('./dialects');
const createSchemaProvider = require('./schema');
const createMetadata = require('./metadata');
const { createEntityManager } = require('./entity-manager');

// TODO: move back into strapi
const { transformContentTypes } = require('./utils/content-types');

class Database {
  constructor(config) {
    this.metadata = createMetadata(config.models);

    // TODO: validate meta
    // this.metadata.validate();

    this.config = config;
    this.dialect = getDialect(this);

    this.schema = createSchemaProvider(this);
    // TODO: migrations -> allow running them through cli before startup

    this.entityManager = createEntityManager(this);
  }

  async initialize() {
    await this.dialect.initialize();
    this.connection = knex(this.config.connection);
  }

  query(uid) {
    if (!this.metadata.has(uid)) {
      throw new Error(`Model ${uid} not found`);
    }

    return this.entityManager.getRepository(uid);
  }

  async destroy() {
    await this.connection.destroy();
  }
}

// TODO: move into strapi
Database.transformContentTypes = transformContentTypes;
Database.init = async config => {
  const db = new Database(config);

  await db.initialize();

  return db;
};

module.exports = {
  Database,
};
