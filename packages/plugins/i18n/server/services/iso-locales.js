'use strict';

const { isoLocales } = require('../constants');

const getIsoLocales = () => isoLocales;

module.exports = () => ({
  getIsoLocales,
});
