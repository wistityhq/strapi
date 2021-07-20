'use strict';

const { join } = require('path');
const { existsSync } = require('fs-extra');
const _ = require('lodash');
const loadFiles = require('../load/load-files');
const loadConfig = require('../load/load-config-files');
const getSupportedFileExtensions = require('../utils/getSupportedFileExtensions');

module.exports = async ({ dir, config }) => {
  const apiDir = join(dir, 'api');

  if (!existsSync(apiDir)) {
    throw new Error(`Missing api folder. Please create one in your app root directory`);
  }
  const fileExtensions = getSupportedFileExtensions(config);
  const apis = await loadFiles(apiDir, `*/!(config)/**/*.*(${fileExtensions})`);
  const apiConfigs = await loadConfig(apiDir, `*/config/**/*.*(${fileExtensions})`);

  return _.merge(apis, apiConfigs);
};
