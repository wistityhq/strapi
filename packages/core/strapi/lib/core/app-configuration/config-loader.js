'use strict';

const path = require('path');
const fs = require('fs');
const loadFile = require('./load-config-file');

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
