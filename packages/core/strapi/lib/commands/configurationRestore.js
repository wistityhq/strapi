'use strict';

const fs = require('fs');
const _ = require('lodash');
const strapi = require('../index');

/**
 * Will restore configurations. It reads from a file or stdin
 * @param {string} file filepath to use as input
 * @param {string} strategy import strategy. one of (replace, merge, keep, default: replace)
 */
module.exports = async function({ file: filePath, strategy = 'replace' }) {
  const input = filePath ? fs.readFileSync(filePath) : await readStdin(process.stdin);

  const app = await strapi().load();

  let dataToImport;
  try {
    dataToImport = JSON.parse(input);
  } catch (error) {
    throw new Error(`Invalid input data: ${error.message}. Expected a valid JSON array.`);
  }

  if (!Array.isArray(dataToImport)) {
    throw new Error(`Invalid input data. Expected a valid JSON array.`);
  }

  const importer = createImporter(app.db, strategy);

  for (const config of dataToImport) {
    await importer.import(config);
  }

  console.log(
    `Successfully imported configuration with ${strategy} strategy. Statistics: ${importer.printStatistics()}.`
  );

  process.exit(0);
};

const readStdin = () => {
  const { stdin } = process;
  let result = '';

  if (stdin.isTTY) return Promise.resolve(result);

  return new Promise((resolve, reject) => {
    stdin.setEncoding('utf8');
    stdin.on('readable', () => {
      let chunk;
      while ((chunk = stdin.read())) {
        result += chunk;
      }
    });

    stdin.on('end', () => {
      resolve(result);
    });

    stdin.on('error', reject);
  });
};

const createImporter = (db, strategy) => {
  switch (strategy) {
    case 'replace':
      return createReplaceImporter(db);
    case 'merge':
      return createMergeImporter(db);
    case 'keep':
      return createKeepImporter(db);
    default:
      throw new Error(`No importer available for strategy "${strategy}"`);
  }
};

/**
 * Replace importer. Will replace the keys that already exist and create the new ones
 * @param {Object} db - DatabaseManager instance
 */
const createReplaceImporter = db => {
  const stats = {
    created: 0,
    replaced: 0,
  };

  return {
    printStatistics() {
      return `${stats.created} created, ${stats.replaced} replaced`;
    },

    async import(conf) {
      const matching = await db.query('strapi::core-store').count({ where: { key: conf.key } });
      if (matching > 0) {
        stats.replaced += 1;
        await db.query('strapi::core-store').update({
          where: { key: conf.key },
          data: conf,
        });
      } else {
        stats.created += 1;
        await db.query('strapi::core-store').create({ data: conf });
      }
    },
  };
};

/**
 * Merge importer. Will merge the keys that already exist with their new value and create the new ones
 * @param {Object} db - DatabaseManager instance
 */
const createMergeImporter = db => {
  const stats = {
    created: 0,
    merged: 0,
  };

  return {
    printStatistics() {
      return `${stats.created} created, ${stats.merged} merged`;
    },

    async import(conf) {
      const existingConf = await db
        .query('strapi::core-store')
        .findOne({ where: { key: conf.key } });

      if (existingConf) {
        stats.merged += 1;
        await db.query('strapi::core-store').update({
          where: { key: conf.key },
          data: _.merge(existingConf, conf),
        });
      } else {
        stats.created += 1;
        await db.query('strapi::core-store').create({ data: conf });
      }
    },
  };
};

/**
 * Merge importer. Will keep the keys that already exist without changing them and create the new ones
 * @param {Object} db - DatabaseManager instance
 */
const createKeepImporter = db => {
  const stats = {
    created: 0,
    untouched: 0,
  };

  return {
    printStatistics() {
      return `${stats.created} created, ${stats.untouched} untouched`;
    },

    async import(conf) {
      const matching = await db.query('strapi::core-store').count({ where: { key: conf.key } });
      if (matching > 0) {
        stats.untouched += 1;
        // if configuration already exists do not overwrite it
        return;
      }

      stats.created += 1;
      await db.query('strapi::core-store').create({ data: conf });
    },
  };
};
