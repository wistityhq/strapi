'use strict';

const { replaceIdByPrimaryKey } = require('../primary-key');

describe('Primary Key', () => {
  describe('replaceIdByPrimaryKey', () => {
    const defaultPostgresModel = { primaryKey: 'id' };
    const defaultMongooseModel = { primaryKey: '_id' };
    const customModel = { primaryKey: 'aRandomPrimaryKey' };

    describe('Model primary key is "id"', () => {
      test('Params has "id"', () => {
        const result = replaceIdByPrimaryKey({ id: '123', color: 'red' }, defaultPostgresModel);
        expect(result).toEqual({ id: '123', color: 'red' });
      });
      test(`Params doesn't have "id"`, () => {
        const result = replaceIdByPrimaryKey({ color: 'red' }, defaultPostgresModel);
        expect(result).toEqual({ color: 'red' });
      });
    });

    describe('Model primary key is "_id"', () => {
      test('Params has "_id"', () => {
        const result = replaceIdByPrimaryKey({ _id: '123', color: 'red' }, defaultMongooseModel);
        expect(result).toEqual({ _id: '123', color: 'red' });
      });
      test('Params has "id"', () => {
        const result = replaceIdByPrimaryKey({ id: '123', color: 'red' }, defaultMongooseModel);
        expect(result).toEqual({ _id: '123', color: 'red' });
      });
      test(`Params doesn't have "id" nor "_id"`, () => {
        const result = replaceIdByPrimaryKey({ color: 'red' }, defaultMongooseModel);
        expect(result).toEqual({ color: 'red' });
      });
    });

    describe('Model primary key is "aRandomPrimaryKey"', () => {
      test('Params has "id"', () => {
        const result = replaceIdByPrimaryKey({ id: '123', color: 'red' }, customModel);
        expect(result).toEqual({ aRandomPrimaryKey: '123', color: 'red' });
      });
      test('Params has "aRandomPrimaryKey"', () => {
        const result = replaceIdByPrimaryKey(
          { aRandomPrimaryKey: '123', color: 'red' },
          customModel
        );
        expect(result).toEqual({ aRandomPrimaryKey: '123', color: 'red' });
      });
      test(`Params doesn't have "id" nor "aRandomPrimaryKey"`, () => {
        const result = replaceIdByPrimaryKey({ color: 'red' }, customModel);
        expect(result).toEqual({ color: 'red' });
      });
    });
  });
});
