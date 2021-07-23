'use strict';

const { arg, list } = require('nexus');

const SortArg = arg({
  type: list('String'),
  default: ['asc'],
});

module.exports = { SortArg };
