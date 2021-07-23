'use strict';

const path = require('path');
const fse = require('fs-extra');

const errors = require('../errors');

class Dialect {
  constructor(db) {
    this.db = db;
  }

  usesForeignKeys() {
    return false;
  }

  useReturning() {
    return false;
  }

  // TODO: pass query info to display some more metadata
  transformErrors(error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(error.message);
  }
}
class PostgresDialect extends Dialect {
  useReturning() {
    return true;
  }

  initialize() {
    // FIXME:
    // this.db.connection.context.client.types.setTypeParser(1700, 'text', parseFloat);
  }

  usesForeignKeys() {
    return false;
  }

  transformErrors(error) {
    switch (error.code) {
      case '23502': {
        throw new errors.NotNullConstraint({ column: error.column });
      }
      default: {
        super.transformErrors(error);
      }
    }
  }
}

class MysqlDialect extends Dialect {
  initialize() {
    this.db.config.connection.connection.supportBigNumbers = true;
    this.db.config.connection.connection.bigNumberStrings = true;
    this.db.config.connection.connection.typeCast = (field, next) => {
      if (field.type == 'DECIMAL' || field.type === 'NEWDECIMAL') {
        var value = field.string();
        return value === null ? null : Number(value);
      }

      if (field.type == 'TINY' && field.length == 1) {
        let value = field.string();
        return value ? value == '1' : null;
      }
      return next();
    };
  }

  usesForeignKeys() {
    return false;
  }

  transformErrors(error) {
    super.transformErrors(error);
  }
}

class SqliteDialect extends Dialect {
  async initialize() {
    // Create the directory if it does not exist.

    // TODO: get strapi.dir from somewhere else

    this.db.config.connection.connection.filename = path.resolve(
      this.db.config.connection.connection.filename
    );

    const dbDir = path.dirname(this.db.config.connection.connection.filename);

    await fse.ensureDir(dbDir);
  }

  transformErrors(error) {
    switch (error.errno) {
      case 19: {
        throw new errors.NotNullConstraint();
      }
      default: {
        super.transformErrors(error);
      }
    }
  }
}

const getDialect = db => {
  const { client } = db.config.connection;

  switch (client) {
    case 'postgres':
      return new PostgresDialect(db);
    case 'mysql':
      return new MysqlDialect(db);
    case 'sqlite':
      return new SqliteDialect(db);
    default:
      throw new Error(`Unknow dialect ${client}`);
  }
};

module.exports = {
  getDialect,
};
