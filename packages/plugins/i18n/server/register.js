'use strict';

const _ = require('lodash');
// const { PUBLISHED_AT_ATTRIBUTE } = require('@strapi/utils').contentTypes.constants;

const { getService } = require('./utils');
// const fieldMigration = require('./migrations/field');
// const enableContentTypeMigration = require('./migrations/content-type/enable');
// const disableContentTypeMigration = require('./migrations/content-type/disable');

module.exports = strapi => {
  const contentTypeService = getService('content-types');
  const coreApiService = getService('core-api');

  _.set(strapi.plugins.i18n.config, 'schema.graphql', {});

  Object.values(strapi.contentTypes).forEach(contentType => {
    if (contentTypeService.isLocalizedContentType(contentType)) {
      const { attributes } = contentType;

      _.set(attributes, 'localizations', {
        writable: true,
        private: false,
        configurable: false,
        visible: false,
        type: 'relation',
        relation: 'oneToMany',
        target: contentType.uid,
        // populate: ['_id', 'id', 'locale', PUBLISHED_AT_ATTRIBUTE],
      });

      _.set(attributes, 'locale', {
        writable: true,
        private: false,
        configurable: false,
        visible: false,
        type: 'string',
      });

      coreApiService.addCreateLocalizationAction(contentType);
      coreApiService.addGraphqlLocalizationAction(contentType);
    }
  });

  // TODO: to implement
  // strapi.db.migrations.register(fieldMigration);
  // strapi.db.migrations.register(enableContentTypeMigration);
  // strapi.db.migrations.register(disableContentTypeMigration);
};
