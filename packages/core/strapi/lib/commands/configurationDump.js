'use strict';

const fs = require('fs');
const strapi = require('../index');

const CHUNK_SIZE = 100;

/**
 * Will dump configurations to a file or stdout
 * @param {string} file filepath to use as output
 */
module.exports = async function({ file: filePath, pretty }) {
  const output = filePath ? fs.createWriteStream(filePath) : process.stdout;

  const app = await strapi().load();

  const count = await app.query('strapi::core-store').count();

  const exportData = [];

  const pageCount = Math.ceil(count / CHUNK_SIZE);

  for (let page = 0; page < pageCount; page++) {
    const results = await app
      .query('strapi::core-store')
      .findMany({ limit: CHUNK_SIZE, offset: page * CHUNK_SIZE, orderBy: 'key' });

    results
      .filter(result => result.key.startsWith('plugin_'))
      .forEach(result => {
        exportData.push({
          key: result.key,
          value: result.value,
          type: result.type,
          environment: result.environment,
          tag: result.tag,
        });
      });
  }

  output.write(JSON.stringify(exportData, null, pretty ? 2 : null));
  output.write('\n');
  output.end();

  // log success only when writting to file
  if (filePath) {
    console.log(`Successfully exported ${exportData.length} configuration entries`);
  }
  process.exit(0);
};
