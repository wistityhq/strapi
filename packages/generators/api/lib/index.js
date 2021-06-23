'use strict';

/**
 * Module dependencies
 */

// Node.js core.
const path = require('path');
// FIXME
/* eslint-disable import/extensions */
// Local dependencies.
const routesJSON = require('../json/routes.json.js');

/**
 * Generate a core API
 */

module.exports = {
  templatesDirectory: path.resolve(__dirname, '..', 'templates'),
  before: require('./before'),
  targets: {
    // Use the default `controller` file as a template for
    // every generated controller.
    ':filePath/controllers/:filename': {
      template: 'controller.template',
    },

    // every generated controller.
    ':filePath/services/:filename': {
      template: 'service.template',
    },

    // Copy an empty JavaScript model where every functions will be.
    ':filePath/models/:filename': {
      template: 'model.template',
    },

    // Copy the generated JSON model for the connection,
    // schema and attributes.
    ':filePath/models/:filenameSettings': {
      template: 'model.settings.template',
    },

    // Generate routes.
    ':filePath/config/routes.json': {
      jsonfile: routesJSON,
    },
  },
};
