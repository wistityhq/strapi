'use strict';

const { merge } = require('lodash');

const { trackUsage } = require('./utils/usage');
const defaultConfigs = require('./utils/db-configs');
const clientDependencies = require('./utils/db-client-dependencies');
const createProject = require('./create-project');

module.exports = async scope => {
  console.log('Creating a project from the database CLI arguments.');
  await trackUsage({ event: 'didChooseCustomDatabase', scope });

  const client = scope.database.client;
  const configuration = {
    client,
    connection: merge({}, defaultConfigs[client] || {}, scope.database),
    dependencies: clientDependencies({ scope, client }),
  };

  return createProject(scope, configuration);
};
