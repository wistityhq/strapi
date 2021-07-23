'use strict';

const assert = require('assert');
const path = require('path');
const _ = require('lodash');
const fse = require('fs-extra');

module.exports = dir => {
  if (!fse.existsSync(dir)) return {};

  const root = {};
  const paths = fse.readdirSync(dir, { withFileTypes: true }).filter(fd => fd.isFile());

  for (let fd of paths) {
    const { name } = fd;
    const fullPath = dir + path.sep + name;

    const ext = path.extname(name);
    const key = path.basename(name, ext);
    root[_.toLower(key)] = loadPolicy(fullPath);
  }

  return root;
};

const loadPolicy = file => {
  try {
    const policy = require(file);

    assert(typeof policy === 'function', 'Policy must be a function.');

    return policy;
  } catch (error) {
    throw `Could not load policy ${file}: ${error.message}`;
  }
};
