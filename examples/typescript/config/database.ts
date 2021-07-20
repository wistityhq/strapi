const sqlite = {
  connector: 'bookshelf',
  settings: {
    client: 'sqlite',
    filename: '.tmp/data.db',
  },
  options: {
    // debug: true,
    useNullAsDefault: true,
  },
};

const postgres = {
  connector: 'bookshelf',
  settings: {
    client: 'postgres',
    database: 'strapi',
    username: 'strapi',
    password: 'strapi',
    port: 5432,
    host: 'localhost',
  },
  options: {},
};

const mysql = {
  connector: 'bookshelf',
  settings: {
    client: 'mysql',
    database: 'strapi',
    username: 'strapi',
    password: 'strapi',
    port: 3306,
    host: 'localhost',
  },
  options: {},
};

const mongo = {
  connector: 'mongoose',
  settings: {
    database: 'strapi',
    username: 'root',
    password: 'strapi',
    port: 27017,
    host: 'localhost',
  },
  options: {},
};

const db = {
  mysql,
  sqlite,
  postgres,
  mongo,
};

module.exports = {
  defaultConnection: 'default',
  connections: {
    default: process.env.DB ? db[process.env.DB] || db.sqlite : db.sqlite,
  },
};
