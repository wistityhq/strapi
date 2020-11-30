'use strict';

const { join, resolve, basename } = require('path');
const os = require('os');
const crypto = require('crypto');
const chalk = require('chalk');
const { machineIdSync } = require('node-machine-id');
const { v4: uuid } = require('uuid');
const sentry = require('@sentry/node');

const hasYarn = require('./utils/has-yarn');
const checkRequirements = require('./utils/check-requirements');
const { trackError, captureException } = require('./utils/usage');
const parseDatabaseArguments = require('./utils/parse-db-arguments');
const generateNew = require('./generate-new');

sentry.init({
  dsn: 'https://841d2b2c9b4d4b43a4cde92794cb705a@sentry.io/1762059',
});

module.exports = (projectDirectory, cliArguments) => {
  checkRequirements();

  const rootPath = resolve(projectDirectory);

  const tmpPath = join(os.tmpdir(), `strapi${crypto.randomBytes(6).toString('hex')}`);

  const useNpm = cliArguments.useNpm !== undefined;

  const scope = {
    rootPath,
    name: basename(rootPath),
    // disable quickstart run app after creation
    runQuickstartApp: cliArguments.run === false ? false : true,
    // use pacakge version as strapiVersion (all packages have the same version);
    strapiVersion: require('../package.json').version,
    debug: cliArguments.debug !== undefined,
    quick: cliArguments.quickstart !== undefined,
    template: cliArguments.template,
    docker: process.env.DOCKER === 'true',
    uuid: (process.env.STRAPI_UUID_PREFIX || '') + uuid(),
    deviceId: machineIdSync(),
    tmpPath,
    // use yarn if available and --use-npm isn't true
    useYarn: !useNpm && hasYarn(),
    installDependencies: true,
    strapiDependencies: [
      'strapi',
      'strapi-admin',
      'strapi-utils',
      'strapi-plugin-content-type-builder',
      'strapi-plugin-content-manager',
      'strapi-plugin-users-permissions',
      'strapi-plugin-email',
      'strapi-plugin-upload',
    ],
    additionalsDependencies: {},
  };

  sentry.configureScope(function(sentryScope) {
    const tags = {
      os_type: os.type(),
      os_platform: os.platform(),
      os_release: os.release(),
      strapi_version: scope.strapiVersion,
      node_version: process.version,
      docker: scope.docker,
    };

    Object.keys(tags).forEach(tag => {
      sentryScope.setTag(tag, tags[tag]);
    });
  });

  parseDatabaseArguments({ scope, args: cliArguments });
  initCancelCatcher(scope);

  console.log(`Creating a new Strapi application at ${chalk.green(rootPath)}.`);
  console.log();

  return generateNew(scope).catch(error => {
    console.error(error);
    return captureException(error).then(() => {
      return trackError({ scope, error }).then(() => {
        process.exit(1);
      });
    });
  });
};

function initCancelCatcher() {
  // Create interface for windows user to let them quit the program.
  if (process.platform === 'win32') {
    const rl = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.on('SIGINT', function() {
      process.emit('SIGINT');
    });
  }

  process.on('SIGINT', () => {
    process.exit(1);
  });
}
