'use strict';

const collectionType = require('./collection-type');
const singleType = require('./single-type');

module.exports = () => ({
  ...collectionType,
  ...singleType,
});
