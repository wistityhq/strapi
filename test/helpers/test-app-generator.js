'use strict';

const path = require('path');
const rimraf = require('rimraf');
const generateNew = require('../../packages/generators/app/lib/generate-new');

// FIXME
/* eslint-disable import/extensions */

/**
 * Delete the testApp folder
 * @param {string} appName - name of the app / folder where the app is located
 */
const cleanTestApp = appName => {
  return new Promise((resolve, reject) => {
    rimraf(path.resolve(appName), err => {
      if (err) reject(err);
      resolve();
    });
  });
};

/**
 * Runs strapi generate new
 * @param {Object} options - Options
 * @param {string} options.appName - Name of the app that will be created (also the name of the folder)
 * @param {database} options.database - Arguments to create the testApp with the provided database params
 */
const generateTestApp = async ({ appName, database }) => {
  const scope = {
    database,
    rootPath: path.resolve(appName),
    name: appName,
    // disable quickstart run app after creation
    runQuickstartApp: false,
    // use package version as strapiVersion (all packages have the same version);
    strapiVersion: require('../../packages/core/strapi/package.json').version,
    debug: false,
    quick: false,
    uuid: undefined,
    deviceId: null,
    // use yarn if available and --use-npm isn't true
    useYarn: true,
    installDependencies: false,
    strapiDependencies: [
      '@strapi/strapi',
      '@strapi/admin',
      '@strapi/utils',
      '@strapi/plugin-content-type-builder',
      '@strapi/plugin-content-manager',
      '@strapi/plugin-users-permissions',
      '@strapi/plugin-email',
      '@strapi/plugin-upload',
      '@strapi/plugin-graphql',
      '@strapi/plugin-documentation',
      '@strapi/plugin-i18n',
    ],
    additionalsDependencies: {},
  };

  await generateNew(scope);
};

module.exports = {
  cleanTestApp,
  generateTestApp,
};
