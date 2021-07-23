'use strict';

const path = require('path');
const fs = require('fs');
const { templateConfiguration, env } = require('strapi-utils');

module.exports = dir => {
  if (!fs.existsSync(dir)) return {};

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(file => file.isFile())
    .reduce((acc, file) => {
      const key = path.basename(file.name, path.extname(file.name));

      acc[key] = loadFile(path.resolve(dir, file.name));

      return acc;
    }, {});
};

const loadFile = file => {
  const ext = path.extname(file);

  switch (ext) {
    case '.js':
      return loadJsFile(file);
    case '.ts':
      return loadJsFile(file);
    case '.json':
      return loadJSONFile(file);
    default:
      return {};
  }
};

const loadJsFile = file => {
  try {
    const jsModule = require(file);

    // call if function
    if (typeof jsModule === 'function') {
      return jsModule({ env });
    }

    return jsModule;
  } catch (error) {
    throw new Error(`Could not load js config file ${file}: ${error.message}`);
  }
};

const loadJSONFile = file => {
  try {
    return templateConfiguration(JSON.parse(fs.readFileSync(file)));
  } catch (error) {
    throw new Error(`Could not load json config file ${file}: ${error.message}`);
  }
};
