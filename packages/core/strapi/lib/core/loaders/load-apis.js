'use strict';

const { join } = require('path');
const { existsSync } = require('fs-extra');
const _ = require('lodash');
const loadFiles = require('../../load/load-files');
const loadConfig = require('../../load/load-config-files');

module.exports = async ({ dir }) => {
  const apiDir = join(dir, 'api');

  if (!existsSync(apiDir)) {
    throw new Error(`Missing api folder. Please create one in your app root directory`);
  }

  const apis = await loadFiles(apiDir, '*/!(config)/**/*.*(js|json)');
  const apiConfigs = await loadConfig(apiDir, '*/config/**/*.*(js|json)');

  return _.merge(apis, apiConfigs);
};
