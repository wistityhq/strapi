'use strict';

const { getDefaultLocale } = require('../utils');
const { getService } = require('../../../utils');

const migrateForBookshelf = require('./migrate-for-bookshelf');

const after = () => {};

// Disable i18n on CT -> Delete all entities that are not in the default locale
const before = async ({ model, definition, previousDefinition, ORM }, context) => {
  const { isLocalizedContentType } = getService('content-types');

  if (isLocalizedContentType(definition) || !isLocalizedContentType(previousDefinition)) {
    return;
  }

  const defaultLocale = await getDefaultLocale(model, ORM);

  await migrateForBookshelf({ ORM, defaultLocale, definition, previousDefinition, model }, context);
};

module.exports = {
  before,
  after,
};
