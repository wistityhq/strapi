'use strict';

/**
 * Module dependencies
 */

// Node.js core.
const path = require('path');
// FIXME
/* eslint-disable import/extensions */
// Local dependencies.
const packageJSON = require('../json/package.json.js');
const routesJSON = require('../json/routes.json.js');

/**
 * Generate a core API
 */

module.exports = {
  templatesDirectory: path.resolve(__dirname, '..', 'templates'),
  before: require('./before'),
  targets: {
    'plugins/:name/.gitignore': {
      copy: 'gitignore',
    },

    // Use the default `controller` file as a template for
    // every generated controller.
    'plugins/:name/controllers/:filename': {
      template: 'controller.template',
    },

    // every generated controller.
    'plugins/:name/services/:filename': {
      template: 'service.template',
    },

    // Generate routes.
    'plugins/:name/config/routes.json': {
      jsonfile: routesJSON,
    },

    // Main package.
    'plugins/:name/package.json': {
      jsonfile: packageJSON,
    },

    // Copy dot files.
    'plugins/:name/.editorconfig': {
      copy: 'editorconfig',
    },

    'plugins/:name/.gitattributes': {
      copy: 'gitattributes',
    },

    // Copy Markdown files with some information.
    'plugins/:name/README.md': {
      template: 'README.md',
    },
  },
};
