'use strict';

const i18nActionsService = require('./permissions/actions');
const sectionsBuilderService = require('./permissions/sections-builder');
const engineService = require('./permissions/engine');

module.exports = () => ({
  actions: i18nActionsService,
  sectionsBuilder: sectionsBuilderService,
  engine: engineService,
});
