'use strict';

const {
  createFindPageQuery,
  createSearchPageQuery,
  createPaginatedQuery,
  getPaginationInfos,
} = require('../paginated-queries');

describe('Paginated Queries', () => {
  describe('createPaginatedQuery', () => {
    test('Successfully create a paginated query based on given fetch and count', async () => {
      const fetch = jest.fn(() => [1, 2]);
      const count = jest.fn(() => 2);

      const paginatedQuery = createPaginatedQuery({ fetch, count });

      const data = await paginatedQuery({});

      expect(fetch).toHaveBeenCalled();
      expect(count).toHaveBeenCalled();
      expect(data).toMatchObject({
        results: [1, 2],
        pagination: {
          page: 1,
          pageSize: 100,
          total: 2,
          pageCount: 1,
        },
      });
    });

    test('Use custom pagination options to find a specific page', async () => {
      const fetch = jest.fn(() => [5, 6]);
      const count = jest.fn(() => 6);

      const paginatedQuery = createPaginatedQuery({ fetch, count });

      const data = await paginatedQuery({ page: 2, pageSize: 4 });

      expect(fetch).toHaveBeenCalled();
      expect(count).toHaveBeenCalled();
      expect(data).toMatchObject({
        results: [5, 6],
        pagination: {
          page: 2,
          pageSize: 4,
          total: 6,
          pageCount: 2,
        },
      });
    });
  });

  describe('createFindPageQuery', () => {
    test('Successfully create a findPage query based on given find and count', async () => {
      const find = jest.fn(() => [1, 2]);
      const count = jest.fn(() => 2);

      const paginatedQuery = createFindPageQuery({ find, count });

      const data = await paginatedQuery({});

      expect(find).toHaveBeenCalled();
      expect(count).toHaveBeenCalled();
      expect(data).toMatchObject({
        results: [1, 2],
        pagination: {
          page: 1,
          pageSize: 100,
          total: 2,
          pageCount: 1,
        },
      });
    });
  });

  describe('createSearchPageQuery', () => {
    test('Successfully create a searchPage query based on given search and countSearch', async () => {
      const search = jest.fn(() => [1, 2]);
      const countSearch = jest.fn(() => 2);

      const paginatedQuery = createSearchPageQuery({ search, countSearch });

      const data = await paginatedQuery({});

      expect(search).toHaveBeenCalled();
      expect(countSearch).toHaveBeenCalled();
      expect(data).toMatchObject({
        results: [1, 2],
        pagination: {
          page: 1,
          pageSize: 100,
          total: 2,
          pageCount: 1,
        },
      });
    });
  });

  describe('getPaginationInfos', () => {
    test('Incomplete last page', async () => {
      const queryParams = { page: 2, pageSize: 6 };
      const count = jest.fn(() => 8);

      const pagination = await getPaginationInfos(queryParams, count);

      expect(count).toHaveBeenCalled();
      expect(pagination).toEqual({
        page: 2,
        pageSize: 6,
        total: 8,
        pageCount: 2,
      });
    });

    test('Complete last page', async () => {
      const queryParams = { page: 2, pageSize: 6 };
      const count = jest.fn(() => 18);

      const pagination = await getPaginationInfos(queryParams, count);

      expect(count).toHaveBeenCalled();
      expect(pagination).toEqual({
        page: 2,
        pageSize: 6,
        total: 18,
        pageCount: 3,
      });
    });
  });
});
