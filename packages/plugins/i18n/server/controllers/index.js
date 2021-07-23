'use strict';

const locales = require('./locales');
const contentTypes = require('./content-types');
const isoLocales = require('./iso-locales');

module.exports = {
  locales,
  'iso-locales': isoLocales,
  'content-types': contentTypes,
};
