'use strict';

const yargs = require('yargs');
const { cleanTestApp, generateTestApp } = require('./helpers/test-app-generator');

const appName = 'testApp';

const databases = {
  postgres: {
    client: 'postgres',
    connection: {
      host: '127.0.0.1',
      port: 5432,
      database: 'strapi_test',
      username: 'strapi',
      password: 'strapi',
    },
  },
  mysql: {
    client: 'mysql',
    connection: {
      host: '127.0.0.1',
      port: 3306,
      database: 'strapi-test',
      username: 'root',
      password: 'root',
    },
  },
  sqlite: {
    client: 'sqlite',
    connection: {
      filename: './tmp/data.db',
    },
  },
};

const main = async database => {
  try {
    await cleanTestApp(appName);
    await generateTestApp({ appName, database });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

yargs
  .command(
    '$0 [databaseName]',
    'Create test app',
    yargs => {
      yargs.positional('databaseName', {
        choices: Object.keys(databases),
      });
    },
    argv => {
      const { databaseName } = argv;
      if (databaseName) {
        return main(databases[databaseName]);
      }

      return main({
        client: argv.dbclient,
        host: argv.dbhost,
        port: argv.dbport,
        database: argv.dbname,
        username: argv.dbusername,
        password: argv.dbpassword,
        filename: argv.dbfile,
      });
    }
  )
  .help().argv;
