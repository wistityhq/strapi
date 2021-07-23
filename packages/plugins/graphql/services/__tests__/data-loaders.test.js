'use strict';

const dataLoaders = require('../old/data-loaders');

describe('dataloader', () => {
  describe('serializeKey', () => {
    test('Serializes objects to json', () => {
      expect(dataLoaders.serializeKey(1928)).toBe(1928);
      expect(dataLoaders.serializeKey('test')).toBe('test');
      expect(dataLoaders.serializeKey([1, 2, 3])).toBe('[1,2,3]');
      expect(dataLoaders.serializeKey({ foo: 'bar' })).toBe('{"foo":"bar"}');
      expect(dataLoaders.serializeKey({ foo: 'bar', nested: { bar: 'foo' } })).toBe(
        '{"foo":"bar","nested":{"bar":"foo"}}'
      );
    });
  });

  describe('makeQuery', () => {
    test('makeQuery single calls findOne', async () => {
      const uid = 'uid';
      const findOne = jest.fn(() => ({ id: 1 }));
      const filters = { _limit: 5 };

      global.strapi = {
        query() {
          return { findOne };
        },
      };

      await dataLoaders.makeQuery(uid, { single: true, filters });

      expect(findOne).toHaveBeenCalledWith(filters, []);
    });

    test('makeQuery calls find', async () => {
      const uid = 'uid';
      const find = jest.fn(() => [{ id: 1 }]);
      const filters = { _limit: 5, _sort: 'field' };

      global.strapi = {
        query() {
          return { find };
        },
      };

      await dataLoaders.makeQuery(uid, { filters });

      expect(find).toHaveBeenCalledWith(filters, []);
    });

    test('makeQuery disables populate to optimize fetching a bit', async () => {
      const uid = 'uid';
      const find = jest.fn(() => [{ id: 1 }]);
      const filters = { _limit: 5 };

      global.strapi = {
        query() {
          return { find };
        },
      };

      await dataLoaders.makeQuery(uid, { filters });

      expect(find).toHaveBeenCalledWith(filters, []);
    });
  });
});
