'use strict';

/**
 * Module dependencies
 */

// Node.js core.
const path = require('path');

// Master of ceremonies for generators.
const generate = require('@strapi/generate');

// Logger.
const { createLogger } = require('@strapi/logger');

// Configuration
const loadConfiguration = require('../core/app-configuration');

// FIXME
/* eslint-disable import/extensions */
// Local Strapi dependencies.
const packageJSON = require('../../package.json');

/**
 * `$ strapi generate`
 *
 * Scaffolding for the application in our working directory.
 */

module.exports = function(id, cliArguments) {
  const dir = process.cwd();
  const config = loadConfiguration(dir);
  const logger = createLogger(config.get('logger', {}));

  // Build initial scope.
  const scope = {
    rootPath: process.cwd(),
    strapiRoot: path.resolve(__dirname, '..'),
    id: id,
    args: cliArguments,
    strapiPackageJSON: packageJSON,
  };

  scope.generatorType = process.argv[2].split(':')[1];

  // Show usage if no generator type is defined.
  if (!scope.generatorType) {
    return logger.error('Write `$ strapi generate:something` instead.');
  }

  return generate(scope, {
    // Log and exit the REPL in case there is an error
    // while we were trying to generate the requested generator.
    error(msg) {
      logger.error(msg);
      process.exit(1);
    },

    // Log and exit the REPL in case of success
    // but first make sure we have all the info we need.
    success() {
      if (!scope.outputPath && scope.filename && scope.destDir) {
        scope.outputPath = scope.destDir + scope.filename;
      }

      if (scope.generatorType !== 'new') {
        logger.info(
          `Generated a new ${scope.generatorType} \`${scope.name}\` at \`${scope.filePath}\`.`
        );
      }

      process.exit(0);
    },
  });
};
