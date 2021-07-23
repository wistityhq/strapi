#!/usr/bin/env node
'use strict';

// FIXME
/* eslint-disable import/extensions */
const _ = require('lodash');
const resolveCwd = require('resolve-cwd');
const { yellow } = require('chalk');
const { Command } = require('commander');

const program = new Command();

const packageJSON = require('../package.json');

const checkCwdIsStrapiApp = name => {
  let logErrorAndExit = () => {
    console.log(
      `You need to run ${yellow(
        `strapi ${name}`
      )} in a Strapi project. Make sure you are in the right directory`
    );
    process.exit(1);
  };

  try {
    const pkgJSON = require(process.cwd() + '/package.json');
    if (!_.has(pkgJSON, 'dependencies.@strapi/strapi')) {
      logErrorAndExit(name);
    }
  } catch (err) {
    logErrorAndExit(name);
  }
};

const getLocalScript = name => (...args) => {
  checkCwdIsStrapiApp(name);

  const cmdPath = resolveCwd.silent(`@strapi/strapi/lib/commands/${name}`);
  if (!cmdPath) {
    console.log(
      `Error loading the local ${yellow(
        name
      )} command. Strapi might not be installed in your "node_modules". You may need to run "npm install"`
    );
    process.exit(1);
  }

  const script = require(cmdPath);

  Promise.resolve()
    .then(() => {
      return script(...args);
    })
    .catch(error => {
      console.error(`Error while running command ${name}: ${error.message || error}`);
      process.exit(1);
    });
};

// Initial program setup
program
  .storeOptionsAsProperties(false)
  .passCommandToAction(false)
  .allowUnknownOption(true);

program.helpOption('-h, --help', 'Display help for command');
program.addHelpCommand('help [command]', 'Display help for command');

// `$ strapi version` (--version synonym)
program.version(packageJSON.version, '-v, --version', 'Output the version number');
program
  .command('version')
  .description('Output your version of Strapi')
  .action(() => {
    process.stdout.write(packageJSON.version + '\n');
    process.exit(0);
  });

// `$ strapi console`
program
  .command('console')
  .description('Open the Strapi framework console')
  .action(getLocalScript('console'));

// `$ strapi new`
program
  .command('new <directory>')
  .option('--no-run', 'Do not start the application after it is created')
  .option('--use-npm', 'Force usage of npm instead of yarn to create the project')
  .option('--debug', 'Display database connection error')
  .option('--quickstart', 'Quickstart app creation')
  .option('--dbclient <dbclient>', 'Database client')
  .option('--dbhost <dbhost>', 'Database host')
  .option('--dbport <dbport>', 'Database port')
  .option('--dbname <dbname>', 'Database name')
  .option('--dbusername <dbusername>', 'Database username')
  .option('--dbpassword <dbpassword>', 'Database password')
  .option('--dbssl <dbssl>', 'Database SSL')
  .option('--dbfile <dbfile>', 'Database file path for sqlite')
  .option('--dbforce', 'Overwrite database content if any')
  .description('Create a new application')
  .action(require('../lib/commands/new'));

// `$ strapi start`
program
  .command('start')
  .description('Start your Strapi application')
  .action(getLocalScript('start'));

// `$ strapi develop`
program
  .command('develop')
  .alias('dev')
  .option('--no-build', 'Disable build')
  .option('--watch-admin', 'Enable watch', false)
  .option('--polling', 'Watching file changes in network directories', false)
  .option('--browser <name>', 'Open the browser', true)
  .description('Start your Strapi application in development mode')
  .action(getLocalScript('develop'));

// `$ strapi generate:api`
program
  .command('generate:api <id> [attributes...]')
  .option('-a, --api <api>', 'API name to generate the files in')
  .option('-p, --plugin <api>', 'Name of the local plugin')
  .option('-e, --extend <api>', 'Name of the plugin to extend')
  .option('--draft-and-publish', 'Enable draft/publish', false)
  .description('Generate a basic API')
  .action((id, attributes, cliArguments) => {
    cliArguments.attributes = attributes;
    getLocalScript('generate')(id, cliArguments);
  });

// `$ strapi generate:controller`
program
  .command('generate:controller <id>')
  .option('-a, --api <api>', 'API name to generate the files in')
  .option('-p, --plugin <api>', 'Name of the local plugin')
  .option('-e, --extend <api>', 'Name of the plugin to extend')
  .description('Generate a controller for an API')
  .action(getLocalScript('generate'));

// `$ strapi generate:model`
program
  .command('generate:model <id> [attributes...]')
  .option('-a, --api <api>', 'API name to generate a sub API')
  .option('-p, --plugin <api>', 'plugin name')
  .option('--draft-and-publish', 'Enable draft/publish', false)
  .description('Generate a model for an API')
  .action((id, attributes, cliArguments) => {
    cliArguments.attributes = attributes;
    getLocalScript('generate')(id, cliArguments);
  });

// `$ strapi generate:policy`
program
  .command('generate:policy <id>')
  .option('-a, --api <api>', 'API name')
  .option('-p, --plugin <api>', 'plugin name')
  .description('Generate a policy for an API')
  .action(getLocalScript('generate'));

// `$ strapi generate:service`
program
  .command('generate:service <id>')
  .option('-a, --api <api>', 'API name')
  .option('-p, --plugin <api>', 'plugin name')
  .description('Generate a service for an API')
  .action(getLocalScript('generate'));

// `$ strapi generate:plugin`
program
  .command('generate:plugin <id>')
  .option('-n, --name <name>', 'Plugin name')
  .description('Generate a basic plugin')
  .action(getLocalScript('generate'));

// `$ strapi generate:template <directory>`
program
  .command('generate:template <directory>')
  .description('Generate template from Strapi project')
  .action(getLocalScript('generate-template'));
program
  .command('build')
  .option('--clean', 'Remove the build and .cache folders', false)
  .option('--no-optimization', 'Build the Administration without assets optimization')
  .description('Builds the strapi admin app')
  .action(getLocalScript('build'));

// `$ strapi install`
program
  .command('install [plugins...]')
  .description('Install a Strapi plugin')
  .action(getLocalScript('install'));

// `$ strapi uninstall`
program
  .command('uninstall [plugins...]')
  .description('Uninstall a Strapi plugin')
  .option('-d, --delete-files', 'Delete files', false)
  .action(getLocalScript('uninstall'));

//   `$ strapi watch-admin`
program
  .command('watch-admin')
  .option('--browser <name>', 'Open the browser', true)
  .description('Starts the admin dev server')
  .action(getLocalScript('watchAdmin'));

program
  .command('configuration:dump')
  .alias('config:dump')
  .description('Dump configurations of your application')
  .option('-f, --file <file>', 'Output file, default output is stdout')
  .option('-p, --pretty', 'Format the output JSON with indentation and line breaks', false)
  .action(getLocalScript('configurationDump'));

program
  .command('configuration:restore')
  .alias('config:restore')
  .description('Restore configurations of your application')
  .option('-f, --file <file>', 'Input file, default input is stdin')
  .option('-s, --strategy <strategy>', 'Strategy name, one of: "replace", "merge", "keep"')
  .action(getLocalScript('configurationRestore'));

// Admin
program
  .command('admin:reset-user-password')
  .alias('admin:reset-password')
  .description("Reset an admin user's password")
  .option('-e, --email <email>', 'The user email')
  .option('-p, --password <password>', 'New password for the user')
  .action(getLocalScript('admin-reset'));

program.parseAsync(process.argv);
