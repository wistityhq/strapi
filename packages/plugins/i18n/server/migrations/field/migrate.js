'use strict';

const { pick, prop } = require('lodash/fp');
const { getService } = require('../../utils');
const { shouldBeProcessed, getUpdatesInfo, getSortedLocales } = require('./utils');

const BATCH_SIZE = 1000;

const migrateBatch = async (entries, { model, attributesToMigrate }, { transacting }) => {
  const { copyNonLocalizedAttributes } = getService('content-types');

  const updatePromises = entries.map(entity => {
    const updateValues = pick(attributesToMigrate, copyNonLocalizedAttributes(model, entity));
    const entriesIdsToUpdate = entity.localizations.map(prop('id'));
    return Promise.all(
      entriesIdsToUpdate.map(id =>
        strapi.query(model.uid).update({ id }, updateValues, { transacting })
      )
    );
  });

  await Promise.all(updatePromises);
};

const migrate = async ({ model, attributesToMigrate }, { migrateFn, transacting } = {}) => {
  const locales = await getSortedLocales({ transacting });
  const processedLocaleCodes = [];
  for (const locale of locales) {
    let offset = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const entries = await strapi
        .query(model.uid)
        .find({ locale, _start: offset, _limit: BATCH_SIZE }, null, { transacting });
      const entriesToProcess = entries.filter(shouldBeProcessed(processedLocaleCodes));

      if (migrateFn) {
        const updatesInfo = getUpdatesInfo({ entriesToProcess, attributesToMigrate });
        await migrateFn({ updatesInfo, model }, { transacting });
      } else {
        await migrateBatch(entriesToProcess, { model, attributesToMigrate }, { transacting });
      }

      if (entries.length < BATCH_SIZE) {
        break;
      }
      offset += BATCH_SIZE;
    }
    processedLocaleCodes.push(locale);
  }
};

module.exports = {
  migrate,
};
