'use strict';

const contenttypes = require('../../services/content-types');
const components = require('../../services/components');
const componentcategories = require('../../services/component-categories');
const builder = require('../../services/builder');
const apiHandler = require('../../services/api-handler');

module.exports = {
  contenttypes,
  components,
  componentcategories,
  builder,
  'api-handler': apiHandler,
};
