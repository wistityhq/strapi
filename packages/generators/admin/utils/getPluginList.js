'use strict';

const glob = require('glob');
const fileExistsInPackages = require('./fileExistsInPackages');
const packagesFolder = require('./packagesFolder');

const asyncFilter = async (array, predicate) => {
  const results = await Promise.all(array.map(predicate));
  return array.filter((_, index) => results[index]);
};

const getPluginList = () => {
  return new Promise((resolve, reject) => {
    glob(
      '{core,plugins}/*',
      { ignore: ['**/node_modules'], cwd: packagesFolder },
      async (err, matches) => {
        if (err) {
          reject(err);
        }

        const extendsAdmin = match => fileExistsInPackages(`${match}/admin/src`);

        resolve(await asyncFilter(matches, extendsAdmin));
      }
    );
  });
};

module.exports = getPluginList;
