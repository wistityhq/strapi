'use strict';

const { join } = require('path');
const fse = require('fs-extra');
const inquirer = require('inquirer');
const execa = require('execa');
const { merge } = require('lodash');

const stopProcess = require('./utils/stop-process');
const { trackUsage } = require('./utils/usage');
const defaultConfigs = require('./utils/db-configs');
const clientDependencies = require('./utils/db-client-dependencies');
const dbQuestions = require('./utils/db-questions');
const createProject = require('./create-project');

module.exports = async scope => {
  await trackUsage({ event: 'didChooseCustomDatabase', scope });

  const configuration = await askDbInfosAndTest(scope).catch(error => {
    return trackUsage({ event: 'didNotConnectDatabase', scope, error }).then(() => {
      throw error;
    });
  });

  console.log();
  console.log('Creating a project with custom database options.');
  await trackUsage({ event: 'didConnectDatabase', scope });
  return createProject(scope, configuration);
};

const MAX_RETRIES = 5;
async function askDbInfosAndTest(scope) {
  let retries = 0;

  async function loop() {
    // else ask for the client name
    const { client, connection } = await askDatabaseInfos(scope);

    const configuration = {
      client,
      connection,
      dependencies: clientDependencies({ scope, client }),
    };

    return testDatabaseConnection({
      scope,
      configuration,
    })
      .then(result => {
        if (result && result.shouldRetry === true && retries < MAX_RETRIES - 1) {
          console.log('Retrying...');
          retries++;
          return loop();
        }
      })
      .then(
        () => fse.remove(scope.tmpPath),
        err => {
          return fse.remove(scope.tmpPath).then(() => {
            throw err;
          });
        }
      )
      .then(() => configuration)
      .catch(err => {
        if (retries < MAX_RETRIES - 1) {
          console.log();
          console.log(`⛔️ Connection test failed: ${err.message}`);
          console.log();

          if (scope.debug) {
            console.log('Full error log:');
            console.log(err);
          }

          console.log('Retrying...');
          retries++;
          return loop();
        }

        console.log(err);
        stopProcess(
          `️⛔️ Could not connect to your database after ${MAX_RETRIES} tries. Try to check your database configuration an retry.`
        );
      });
  }

  return loop();
}

async function testDatabaseConnection({ scope, configuration }) {
  const { client } = configuration;

  if (client === 'sqlite') return;

  return;

  // TODO: test DB connection somehow

  await installDatabaseTestingDep({
    scope,
    configuration,
  });

  const connectivityFile = join(
    scope.tmpPath,
    'node_modules',
    `@strapi/connector-${configuration.connection.connector}`,
    'lib',
    'utils',
    'connectivity.js'
  );

  const tester = require(connectivityFile);
  return tester({ scope, connection: configuration.connection });
}

async function askDatabaseInfos(scope) {
  const { client } = await inquirer.prompt([
    {
      type: 'list',
      name: 'client',
      message: 'Choose your default database client',
      choices: ['sqlite', 'postgres', 'mysql'],
      default: 'sqlite',
    },
  ]);

  const responses = await inquirer.prompt(dbQuestions[client].map(q => q({ scope, client })));

  const connection = merge({}, defaultConfigs[client] || {}, {
    client,
    connection: responses,
  });

  return {
    client,
    connection,
  };
}

async function installDatabaseTestingDep({ scope, configuration }) {
  let packageManager = scope.useYarn ? 'yarnpkg' : 'npm';
  let cmd = scope.useYarn
    ? ['--cwd', scope.tmpPath, 'add']
    : ['install', '--prefix', scope.tmpPath];

  // Manually create the temp directory for yarn
  if (scope.useYarn) {
    await fse.ensureDir(scope.tmpPath);
  }

  const deps = Object.keys(configuration.dependencies).map(dep => {
    return `${dep}@${configuration.dependencies[dep]}`;
  });

  await execa(packageManager, cmd.concat(deps));
}
