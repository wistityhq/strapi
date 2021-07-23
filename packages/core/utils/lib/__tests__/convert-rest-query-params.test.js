'use strict';

const { convertRestQueryParams } = require('../convert-rest-query-params');

describe('convertRestQueryParams', () => {
  test('Throws on invalid input', () => {
    // throws when no params provided
    expect(() => convertRestQueryParams(1)).toThrow();
    expect(() => convertRestQueryParams('azdazd')).toThrow();
    expect(() => convertRestQueryParams(null)).toThrow();
  });

  test('Runs correctly on valid input', () => {
    // returns empty if no params
    expect(convertRestQueryParams()).toMatchObject({});
    expect(convertRestQueryParams({})).toMatchObject({});

    expect(
      convertRestQueryParams({
        _sort: 'id:desc,price',
        _start: '5',
        _limit: '10',
      })
    ).toMatchObject({
      sort: [{ id: 'desc' }, { price: 'asc' }],
      start: 5,
      limit: 10,
    });
  });

  describe('Sort param', () => {
    test('Throws on invalid params', () => {
      // invalid sort queries
      expect(() => convertRestQueryParams({ _sort: 1 })).toThrow();
      expect(() => convertRestQueryParams({ _sort: {} })).toThrow();
      expect(() => convertRestQueryParams({ _sort: 'id,,test' })).toThrow();
      expect(() => convertRestQueryParams({ _sort: 'id,test,' })).toThrow();
      expect(() => convertRestQueryParams({ _sort: 'id:asc,test:dasc' })).toThrow();
      expect(() => convertRestQueryParams({ _sort: 'id:asc,:asc' })).toThrow();
    });

    test.each([
      ['id', [{ id: 'asc' }]],
      ['id:desc', [{ id: 'desc' }]],
      ['id:ASC', [{ id: 'asc' }]],
      ['id:DESC', [{ id: 'desc' }]],
      ['id:asc', [{ id: 'asc' }]],
      ['id,price', [{ id: 'asc' }, { price: 'asc' }]],
      ['id:desc,price', [{ id: 'desc' }, { price: 'asc' }]],
      ['id:desc,price:desc', [{ id: 'desc' }, { price: 'desc' }]],
      ['id:asc,price,date:desc', [{ id: 'asc' }, { price: 'asc' }, { date: 'desc' }]],
      [
        'published_at:asc,price:ASC,date:DESC',
        [{ published_at: 'asc' }, { price: 'asc' }, { date: 'desc' }],
      ],
    ])('Converts sort query "%s" correctly', (input, expected) => {
      expect(convertRestQueryParams({ _sort: input })).toMatchObject({
        sort: expected,
      });
    });
  });

  describe('Start param', () => {
    test('Throws on invalid params', () => {
      // invalid sort queries
      expect(() => convertRestQueryParams({ _start: 'du text' })).toThrow();
      expect(() => convertRestQueryParams({ _start: '12 du text' })).toThrow();
      expect(() => convertRestQueryParams({ _start: '12.1' })).toThrow();
      expect(() => convertRestQueryParams({ _start: 'NaN' })).toThrow();
      expect(() => convertRestQueryParams({ _start: 'Infinity' })).toThrow();
      expect(() => convertRestQueryParams({ _start: Infinity })).toThrow();
      expect(() => convertRestQueryParams({ _start: -Infinity })).toThrow();
      expect(() => convertRestQueryParams({ _start: NaN })).toThrow();
      expect(() => convertRestQueryParams({ _start: 1.2 })).toThrow();
      expect(() => convertRestQueryParams({ _start: -10 })).toThrow();
      expect(() => convertRestQueryParams({ _start: {} })).toThrow();
    });

    test.each([
      ['1', 1],
      ['12', 12],
      ['0', 0],
    ])('Converts start query "%s" correctly', (input, expected) => {
      expect(convertRestQueryParams({ _start: input })).toMatchObject({
        start: expected,
      });
    });
  });

  describe('Limit param', () => {
    test('Throws on invalid params', () => {
      // invalid sort queries
      expect(() => convertRestQueryParams({ _limit: 'du text' })).toThrow();
      expect(() => convertRestQueryParams({ _limit: '12 du text' })).toThrow();
      expect(() => convertRestQueryParams({ _limit: '12.1' })).toThrow();
      expect(() => convertRestQueryParams({ _limit: 'NaN' })).toThrow();
      expect(() => convertRestQueryParams({ _limit: 'Infinity' })).toThrow();
      expect(() => convertRestQueryParams({ _limit: Infinity })).toThrow();
      expect(() => convertRestQueryParams({ _limit: -Infinity })).toThrow();
      expect(() => convertRestQueryParams({ _limit: NaN })).toThrow();
      expect(() => convertRestQueryParams({ _limit: 1.2 })).toThrow();
      expect(() => convertRestQueryParams({ _limit: -10 })).toThrow();
      expect(() => convertRestQueryParams({ _limit: {} })).toThrow();
    });

    test.each([
      ['1', 1],
      ['12', 12],
      ['0', 0],
    ])('Converts start query "%s" correctly', (input, expected) => {
      expect(convertRestQueryParams({ _start: input })).toMatchObject({
        start: expected,
      });
    });
  });

  describe('Publication State param', () => {
    test.each([
      { _publicationState: 'foobar' },
      { _publicationState: undefined },
      { _publicationState: null },
    ])('Throws on invalid params (%#)', params => {
      expect(() => convertRestQueryParams(params)).toThrow();
    });

    test.each([
      ['Live Mode', { _publicationState: 'live' }],
      ['Preview Mode', { _publicationState: 'preview' }, []],
    ])('%s', (name, params) => {
      const result = convertRestQueryParams(params);

      expect(result._publicationState).toBeUndefined();
      expect(result.publicationState).toBe(params._publicationState);
    });
  });

  describe('Filters', () => {
    test('Can combine filters', () => {
      expect(convertRestQueryParams({ id: '1', test_ne: 'text', test_: 'content' })).toMatchObject({
        where: [
          {
            field: 'id',
            operator: 'eq',
            value: '1',
          },
          {
            field: 'test',
            operator: 'ne',
            value: 'text',
          },
          {
            field: 'test_',
            operator: 'eq',
            value: 'content',
          },
        ],
      });
    });

    test('Ok', () => {
      expect(convertRestQueryParams({ id: '1', test: 'text' })).toMatchObject({
        where: [
          {
            field: 'id',
            operator: 'eq',
            value: '1',
          },
          {
            field: 'test',
            operator: 'eq',
            value: 'text',
          },
        ],
      });

      expect(convertRestQueryParams({ id_eq: '1', test_eq: 'text' })).toMatchObject({
        where: [
          {
            field: 'id',
            operator: 'eq',
            value: '1',
          },
          {
            field: 'test',
            operator: 'eq',
            value: 'text',
          },
        ],
      });

      expect(convertRestQueryParams({ published_at: '2019-01-01:00:00:00' })).toMatchObject({
        where: [
          {
            field: 'published_at',
            operator: 'eq',
            value: '2019-01-01:00:00:00',
          },
        ],
      });
    });

    test('Not Eq', () => {
      expect(convertRestQueryParams({ id_ne: 1 })).toMatchObject({
        where: [
          {
            field: 'id',
            operator: 'ne',
            value: 1,
          },
        ],
      });
    });

    test('Less than', () => {
      expect(convertRestQueryParams({ id_lt: 1 })).toMatchObject({
        where: [
          {
            field: 'id',
            operator: 'lt',
            value: 1,
          },
        ],
      });
    });

    test('Less than or equal', () => {
      expect(convertRestQueryParams({ id_lte: 1 })).toMatchObject({
        where: [
          {
            field: 'id',
            operator: 'lte',
            value: 1,
          },
        ],
      });
    });

    test('Greater than', () => {
      expect(convertRestQueryParams({ id_gt: 1 })).toMatchObject({
        where: [
          {
            field: 'id',
            operator: 'gt',
            value: 1,
          },
        ],
      });
    });

    test('Greater than or equal', () => {
      expect(convertRestQueryParams({ id_gte: 1 })).toMatchObject({
        where: [
          {
            field: 'id',
            operator: 'gte',
            value: 1,
          },
        ],
      });
    });

    test('In', () => {
      expect(convertRestQueryParams({ id_in: [1, 2] })).toMatchObject({
        where: [
          {
            field: 'id',
            operator: 'in',
            value: [1, 2],
          },
        ],
      });
    });

    test('Not in', () => {
      expect(convertRestQueryParams({ id_nin: [1, 3] })).toMatchObject({
        where: [
          {
            field: 'id',
            operator: 'nin',
            value: [1, 3],
          },
        ],
      });
    });

    test('Contains', () => {
      expect(convertRestQueryParams({ id_contains: 'text' })).toMatchObject({
        where: [
          {
            field: 'id',
            operator: 'contains',
            value: 'text',
          },
        ],
      });
    });

    test('Contains sensitive', () => {
      expect(convertRestQueryParams({ id_containss: 'test' })).toMatchObject({
        where: [
          {
            field: 'id',
            operator: 'containss',
            value: 'test',
          },
        ],
      });
    });

    test('Not Contains', () => {
      expect(convertRestQueryParams({ sub_title_ncontains: 'text' })).toMatchObject({
        where: [
          {
            field: 'sub_title',
            operator: 'ncontains',
            value: 'text',
          },
        ],
      });
    });

    test('Not Contains sensitive', () => {
      expect(convertRestQueryParams({ content_text_ncontainss: 'test' })).toMatchObject({
        where: [
          {
            field: 'content_text',
            operator: 'ncontainss',
            value: 'test',
          },
        ],
      });
    });

    test('Not Contains sensitive', () => {
      expect(convertRestQueryParams({ 'content.text_ncontainss': 'test' })).toMatchObject({
        where: [
          {
            field: 'content.text',
            operator: 'ncontainss',
            value: 'test',
          },
        ],
      });
    });

    test('Null', () => {
      expect(convertRestQueryParams({ 'content.text_null': true })).toMatchObject({
        where: [
          {
            field: 'content.text',
            operator: 'null',
            value: true,
          },
        ],
      });
    });

    test('Not Null', () => {
      expect(convertRestQueryParams({ 'content.text_null': false })).toMatchObject({
        where: [
          {
            field: 'content.text',
            operator: 'null',
            value: false,
          },
        ],
      });
    });
  });
});
