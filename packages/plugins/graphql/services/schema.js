'use strict';

const createContentAPISchemaGenerator = require('./schema/generators/content-api');

module.exports = strapi => ({
  generateContentAPISchema: createContentAPISchemaGenerator(strapi),
});
