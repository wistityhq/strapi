'use strict';

const { after } = require('../content-type/enable');
const { before } = require('../content-type/disable');
const ctService = require('../../services/content-types');

describe('i18n - Migration - enable/disable localization on a CT', () => {
  beforeAll(() => {
    global.strapi = {
      plugins: { i18n: { services: { 'content-types': ctService } } },
    };
  });

  describe('enable localization on a CT', () => {
    describe('Should not migrate', () => {
      test('non i18n => non i18n', async () => {
        const previousDefinition = {};
        const definition = {};

        await after({ definition, previousDefinition });
      });

      test('i18n => non i18n', async () => {
        const previousDefinition = { pluginOptions: { i18n: { localized: true } } };
        const definition = {};

        await after({ definition, previousDefinition });
      });

      test('i18n => i18n', async () => {
        const previousDefinition = { pluginOptions: { i18n: { localized: true } } };
        const definition = { pluginOptions: { i18n: { localized: true } } };

        await after({ definition, previousDefinition });
      });
    });
    describe('Should migrate', () => {
      describe('bookshelf', () => {
        test('non i18n => i18n - default locale in core_store', async () => {
          const model = { orm: 'bookshelf' };
          const previousDefinition = {};
          const definition = { pluginOptions: { i18n: { localized: true } } };
          const defaultLocaleRows = [{ value: '"fr"' }];
          const where = jest.fn().mockReturnValueOnce(Promise.resolve(defaultLocaleRows));

          const knex = { where };
          knex.select = () => knex;
          knex.from = () => knex;
          knex.update = jest.fn(() => knex);

          const ORM = { knex };

          await after({ model, definition, previousDefinition, ORM });

          expect(knex.update).toHaveBeenCalledWith({ locale: 'fr' });
        });

        test('non i18n => i18n - default locale not in core_store', async () => {
          const model = { orm: 'bookshelf' };
          const previousDefinition = {};
          const definition = { pluginOptions: { i18n: { localized: true } } };
          const defaultLocaleRows = [];
          const where = jest.fn().mockReturnValueOnce(Promise.resolve(defaultLocaleRows));

          const knex = { where };
          knex.select = () => knex;
          knex.from = () => knex;
          knex.update = jest.fn(() => knex);

          const ORM = { knex };

          await after({ model, definition, previousDefinition, ORM });

          expect(knex.update).toHaveBeenCalledWith({ locale: 'en' });
        });
      });
    });
  });

  describe('disable localization on a CT', () => {
    describe('Should not migrate', () => {
      test('non i18n => non i18n', async () => {
        const previousDefinition = {};
        const definition = {};

        await before({ definition, previousDefinition });
      });

      test('non i18n => i18n', async () => {
        const previousDefinition = {};
        const definition = { pluginOptions: { i18n: { localized: true } } };

        await before({ definition, previousDefinition });
      });

      test('i18n => i18n', async () => {
        const previousDefinition = { pluginOptions: { i18n: { localized: true } } };
        const definition = { pluginOptions: { i18n: { localized: true } } };

        await before({ definition, previousDefinition });
      });
    });
    describe('Should migrate', () => {
      describe('bookshelf', () => {
        test('i18n => non i18n - pg', async () => {
          const previousDefinition = {
            pluginOptions: { i18n: { localized: true } },
            collectionName: 'countries',
          };
          const definition = { client: 'pg' };
          const defaultLocaleRows = [{ value: '"fr"' }];
          const deleteRelations = jest.fn();
          const dropTableIfExists = jest.fn();
          const table = jest.fn();
          const model = { orm: 'bookshelf', deleteRelations };
          const where = jest.fn(() => Promise.resolve(defaultLocaleRows));
          const trx = {
            limit: jest.fn(),
            commit: jest.fn(),
          };
          trx.select = jest.fn(() => trx);
          trx.del = jest.fn(() => trx);
          trx.from = jest.fn(() => trx);
          trx.whereNot = jest.fn().mockReturnValueOnce(trx);
          trx.orderBy = jest.fn(() => trx);
          trx.offset = jest.fn(() => trx);
          trx.limit = jest.fn(() => Promise.resolve([{ id: 1 }, { id: 2 }]));
          const transaction = jest.fn(() => Promise.resolve(trx));
          const knex = { where, transaction, schema: { dropTableIfExists, table } };
          knex.select = jest.fn(() => knex);
          knex.from = jest.fn(() => knex);
          const ORM = { knex };

          await before({ model, definition, previousDefinition, ORM });

          expect(deleteRelations).toHaveBeenCalledTimes(2);
          expect(deleteRelations).toHaveBeenNthCalledWith(1, 1, { transacting: trx });
          expect(deleteRelations).toHaveBeenNthCalledWith(2, 2, { transacting: trx });
          expect(trx.del).toHaveBeenCalled();
          expect(trx.whereNot).toHaveBeenNthCalledWith(2, 'locale', 'fr');
          expect(transaction).toHaveBeenCalled();
          expect(trx.commit).toHaveBeenCalled();
          expect(table).toHaveBeenCalled();
          expect(dropTableIfExists).toHaveBeenCalledWith('countries__localizations');
        });
        test('i18n => non i18n - sqlite', async () => {
          const previousDefinition = {
            pluginOptions: { i18n: { localized: true } },
            collectionName: 'countries',
          };
          const definition = { client: 'sqlite3' };
          const defaultLocaleRows = [{ value: '"fr"' }];
          const deleteRelations = jest.fn();
          const dropTableIfExists = jest.fn();
          const table = jest.fn();
          const model = { orm: 'bookshelf', deleteRelations };
          const where = jest.fn(() => Promise.resolve(defaultLocaleRows));
          const trx = {
            limit: jest.fn(),
            commit: jest.fn(),
          };
          trx.select = jest.fn(() => trx);
          trx.del = jest.fn(() => trx);
          trx.from = jest.fn(() => trx);
          trx.whereNot = jest.fn().mockReturnValueOnce(trx);
          trx.orderBy = jest.fn(() => trx);
          trx.offset = jest.fn(() => trx);
          trx.limit = jest.fn(() => Promise.resolve([{ id: 1 }, { id: 2 }]));
          const transaction = jest.fn(() => Promise.resolve(trx));
          const knex = { where, transaction, schema: { dropTableIfExists, table } };
          knex.select = jest.fn(() => knex);
          knex.from = jest.fn(() => knex);
          const ORM = { knex };

          const context = {};
          await before({ model, definition, previousDefinition, ORM }, context);

          expect(deleteRelations).toHaveBeenCalledTimes(2);
          expect(deleteRelations).toHaveBeenNthCalledWith(1, 1, { transacting: trx });
          expect(deleteRelations).toHaveBeenNthCalledWith(2, 2, { transacting: trx });
          expect(trx.del).toHaveBeenCalled();
          expect(trx.whereNot).toHaveBeenNthCalledWith(2, 'locale', 'fr');
          expect(transaction).toHaveBeenCalled();
          expect(trx.commit).toHaveBeenCalled();
          expect(table).not.toHaveBeenCalled();
          expect(context).toEqual({ recreateSqliteTable: true });
          expect(dropTableIfExists).toHaveBeenCalledWith('countries__localizations');
        });
      });
    });
  });
});
