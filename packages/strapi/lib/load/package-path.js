'use strict';

const path = require('path');

/**
 * Returns the path to a node modules root directory (not the main file path)
 * @param {string} moduleName - name of a node module
 */
module.exports = moduleName => {
  let packagePath = null;

  try {
    packagePath = require.resolve(`${moduleName}/package.json`);
  } catch (err) {
    const projectPackageJson = require(path.join(strapi.dir, 'package.json'));
    const dependencies = Object.keys(projectPackageJson.dependencies);
    const scopedModule = dependencies.find(d => d.includes(moduleName));
    packagePath = require.resolve(`${scopedModule}/package.json`);
  }

  return path.dirname(packagePath);
};
