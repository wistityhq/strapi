'use strict';

const createCollectionTypeMutationsBuilder = require('./collection-type');
const createSingleTypeMutationsBuilder = require('./single-type');

module.exports = context => ({
  ...createCollectionTypeMutationsBuilder(context),
  ...createSingleTypeMutationsBuilder(context),
});
