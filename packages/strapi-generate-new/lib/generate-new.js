'use strict';

/**
 * Module dependencies
 */

// Node.js core.
const chalk = require('chalk');
const inquirer = require('inquirer');
const fse = require('fs-extra');

const { trackUsage } = require('./utils/usage');
const stopProcess = require('./utils/stop-process');
const createCLIDatabaseProject = require('./create-cli-db-project');
const createCustomizeProject = require('./create-customized-project');
const createQuickStartProject = require('./create-quickstart-project');

module.exports = async scope => {
  const hasDatabaseConfig = Boolean(scope.database);

  // check rootPath is empty
  if (await fse.exists(scope.rootPath)) {
    const stat = await fse.stat(scope.rootPath);

    if (!stat.isDirectory()) {
      stopProcess(
        `⛔️ ${chalk.green(
          scope.rootPath
        )} is not a directory. Make sure to create a Strapi application in an empty directory.`
      );
    }

    const files = await fse.readdir(scope.rootPath);
    if (files.length > 1) {
      const shouldInstallInNonEmptyDirectory = await askShouldInstallInNonEmptyDirectory(
        scope.rootPath
      );
      if (!shouldInstallInNonEmptyDirectory) {
        stopProcess(`⛔️ Aborted because ${chalk.green(scope.rootPath)} is not empty.`);
      }
    }
  }

  await trackUsage({ event: 'willCreateProject', scope });

  // if database config is provided don't test the connection and create the project directly
  if (hasDatabaseConfig) {
    return createCLIDatabaseProject(scope);
  }

  // if cli quickstart create project with default sqlite options
  if (scope.quick === true) {
    return createQuickStartProject(scope);
  }

  const useQuickStart = await askShouldUseQuickstart();
  // else if question response is quickstart create project
  if (useQuickStart) {
    return createQuickStartProject(scope);
  }

  // create a project with full list of questions
  return createCustomizeProject(scope);
};

async function askShouldUseQuickstart() {
  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'Choose your installation type',
      choices: [
        {
          name: 'Quickstart (recommended)',
          value: 'quick',
        },
        {
          name: 'Custom (manual settings)',
          value: 'custom',
        },
      ],
    },
  ]);

  return answer.type === 'quick';
}

async function askShouldInstallInNonEmptyDirectory(rootPath) {
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'installInNonEmptyDirectory',
      message:
        `The target directory (${rootPath}) is not empty. This may cause problems.\n` +
        `Do you want to install anyway?`,
      default: false,
    },
  ]);

  return answer.installInNonEmptyDirectory;
}
