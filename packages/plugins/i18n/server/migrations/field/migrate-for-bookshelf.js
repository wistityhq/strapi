'use strict';

const { migrate } = require('./migrate');
const { areScalarAttributesOnly } = require('./utils');

const TMP_TABLE_NAME = '__tmp__i18n_field_migration';

const batchInsertInTmpTable = async ({ updatesInfo }, { transacting: trx }) => {
  const tmpEntries = [];
  updatesInfo.forEach(({ entriesIdsToUpdate, attributesValues }) => {
    entriesIdsToUpdate.forEach(id => {
      tmpEntries.push({ id, ...attributesValues });
    });
  });
  await trx.batchInsert(TMP_TABLE_NAME, tmpEntries, 100);
};

const updateFromTmpTable = async ({ model, attributesToMigrate }, { transacting: trx }) => {
  const collectionName = model.collectionName;
  if (model.client === 'pg') {
    const substitutes = attributesToMigrate.map(() => '?? = ??.??').join(',');
    const bindings = [collectionName];
    attributesToMigrate.forEach(attr => bindings.push(attr, TMP_TABLE_NAME, attr));
    bindings.push(TMP_TABLE_NAME, collectionName, TMP_TABLE_NAME);

    await trx.raw(`UPDATE ?? SET ${substitutes} FROM ?? WHERE ??.id = ??.id;`, bindings);
  } else if (model.client === 'mysql') {
    const substitutes = attributesToMigrate.map(() => '??.?? = ??.??').join(',');
    const bindings = [collectionName, TMP_TABLE_NAME, collectionName, TMP_TABLE_NAME];
    attributesToMigrate.forEach(attr => bindings.push(collectionName, attr, TMP_TABLE_NAME, attr));

    await trx.raw(`UPDATE ?? JOIN ?? ON ??.id = ??.id SET ${substitutes};`, bindings);
  }
};

const createTmpTable = async ({ ORM, attributesToMigrate, model }) => {
  const columnsToCopy = ['id', ...attributesToMigrate];
  await deleteTmpTable({ ORM });
  await ORM.knex.raw(`CREATE TABLE ?? AS ??`, [
    TMP_TABLE_NAME,
    ORM.knex
      .select(columnsToCopy)
      .from(model.collectionName)
      .whereRaw('?', 0),
  ]);
};

const deleteTmpTable = ({ ORM }) => ORM.knex.schema.dropTableIfExists(TMP_TABLE_NAME);

const migrateForBookshelf = async ({ ORM, model, attributesToMigrate }) => {
  const onlyScalarAttrs = areScalarAttributesOnly({ model, attributes: attributesToMigrate });

  // optimize migration for pg and mysql when there are only scalar attributes to migrate
  if (onlyScalarAttrs && ['pg', 'mysql'].includes(model.client)) {
    // create table outside of the transaction because mysql doesn't accept the creation inside
    await createTmpTable({ ORM, attributesToMigrate, model });
    await ORM.knex.transaction(async transacting => {
      await migrate(
        { model, attributesToMigrate },
        { migrateFn: batchInsertInTmpTable, transacting }
      );
      await updateFromTmpTable({ model, attributesToMigrate }, { transacting });
    });
    await deleteTmpTable({ ORM });
  } else {
    await ORM.knex.transaction(async transacting => {
      await migrate({ model, attributesToMigrate }, { transacting });
    });
  }
};

module.exports = migrateForBookshelf;
