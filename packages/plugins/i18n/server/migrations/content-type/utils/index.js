'use strict';

const { DEFAULT_LOCALE } = require('../../../constants');

const getDefaultLocale = async (model, ORM) => {
  let defaultLocaleRows;
  if (model.orm === 'bookshelf') {
    defaultLocaleRows = await ORM.knex
      .select('value')
      .from('core_store')
      .where({ key: 'plugin_i18n_default_locale' });
  } else if (model.orm === 'mongoose') {
    defaultLocaleRows = await strapi.models['core_store'].find({
      key: 'plugin_i18n_default_locale',
    });
  }

  if (defaultLocaleRows.length > 0) {
    return JSON.parse(defaultLocaleRows[0].value);
  }

  return DEFAULT_LOCALE.code;
};

module.exports = {
  getDefaultLocale,
};
