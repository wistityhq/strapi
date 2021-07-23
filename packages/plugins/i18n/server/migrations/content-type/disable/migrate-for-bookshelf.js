'use strict';

const pmap = require('p-map');

const BATCH_SIZE = 1000;

const migrateForBookshelf = async (
  { ORM, defaultLocale, definition, previousDefinition, model },
  context
) => {
  const localizationsTable = `${previousDefinition.collectionName}__localizations`;
  const trx = await ORM.knex.transaction();
  try {
    let offset = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let batch = await trx
        .select(['id'])
        .from(model.collectionName)
        .whereNot('locale', defaultLocale)
        .orderBy('id')
        .offset(offset)
        .limit(BATCH_SIZE);
      offset += BATCH_SIZE;

      await pmap(batch, entry => model.deleteRelations(entry.id, { transacting: trx }), {
        concurrency: 100,
        stopOnError: true,
      });

      if (batch.length < BATCH_SIZE) {
        break;
      }
    }
    await trx
      .from(model.collectionName)
      .del()
      .whereNot('locale', defaultLocale);
    await trx.commit();
  } catch (e) {
    await trx.rollback();
    throw e;
  }

  if (definition.client === 'sqlite3') {
    // Bug when dropping column with sqlite3 https://github.com/knex/knex/issues/631
    // Need to recreate the table
    context.recreateSqliteTable = true;
  } else {
    await ORM.knex.schema.table(definition.collectionName, t => {
      t.dropColumn('locale');
    });
  }

  await ORM.knex.schema.dropTableIfExists(localizationsTable);
};

module.exports = migrateForBookshelf;
