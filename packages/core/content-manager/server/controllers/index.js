'use strict';

const collectionTypes = require('../../controllers/collection-types');
const components = require('../../controllers/components');
const contentTypes = require('../../controllers/content-types');
const relations = require('../../controllers/relations');
const singleTypes = require('../../controllers/single-types');
const uid = require('../../controllers/uid');

module.exports = {
  'collection-types': collectionTypes,
  components,
  'content-types': contentTypes,
  relations,
  'single-types': singleTypes,
  uid,
};
