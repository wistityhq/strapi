'use strict';

const { isScalarAttribute } = require('@strapi/utils').contentTypes;
const { pick, prop, map, intersection, isEmpty, orderBy, pipe, every } = require('lodash/fp');
const { getService } = require('../../utils');

const shouldBeProcessed = processedLocaleCodes => entry => {
  return (
    entry.localizations.length > 0 &&
    intersection(entry.localizations.map(prop('locale')), processedLocaleCodes).length === 0
  );
};

const getUpdatesInfo = ({ entriesToProcess, attributesToMigrate }) => {
  const updates = [];
  for (const entry of entriesToProcess) {
    const attributesValues = pick(attributesToMigrate, entry);
    const entriesIdsToUpdate = entry.localizations.map(prop('id'));
    updates.push({ entriesIdsToUpdate, attributesValues });
  }
  return updates;
};

const getSortedLocales = async ({ transacting } = {}) => {
  const localeService = getService('locales');

  let defaultLocale;
  try {
    const storeRes = await strapi
      .query('strapi::core-store')
      .findOne({ key: 'plugin_i18n_default_locale' }, null, { transacting });
    defaultLocale = JSON.parse(storeRes.value);
  } catch (e) {
    throw new Error("Could not migrate because the default locale doesn't exist");
  }

  const locales = await localeService.find({}, null, { transacting });
  if (isEmpty(locales)) {
    throw new Error('Could not migrate because no locale exist');
  }

  // Put default locale first
  return pipe(
    map(locale => ({ code: locale.code, isDefault: locale.code === defaultLocale })),
    orderBy(['isDefault', 'code'], ['desc', 'asc']),
    map(prop('code'))
  )(locales);
};

const areScalarAttributesOnly = ({ model, attributes }) =>
  pipe(pick(attributes), every(isScalarAttribute))(model.attributes);

module.exports = {
  shouldBeProcessed,
  getUpdatesInfo,
  getSortedLocales,
  areScalarAttributesOnly,
};
