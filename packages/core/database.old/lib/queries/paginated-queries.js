'use strict';

const _ = require('lodash');

const createPaginatedQuery = ({ fetch, count }) => async (queryParams, ...args) => {
  const params = _.omit(queryParams, ['page', 'pageSize']);
  const pagination = await getPaginationInfos(queryParams, count, ...args);

  Object.assign(params, paginationToQueryParams(pagination));
  const results = await fetch(params, undefined, ...args);

  return { results, pagination };
};

const createSearchPageQuery = ({ search, countSearch }) =>
  createPaginatedQuery({ fetch: search, count: countSearch });

const createFindPageQuery = ({ find, count }) => createPaginatedQuery({ fetch: find, count });

const getPaginationInfos = async (queryParams, count, ...args) => {
  const { page, pageSize, ...params } = withDefaultPagination(queryParams);

  const total = await count(params, ...args);
  return {
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
    total,
  };
};

const withDefaultPagination = params => {
  const { page = 1, pageSize = 100, ...rest } = params;

  return {
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    ...rest,
  };
};

const paginationToQueryParams = ({ page, pageSize }) => ({
  _start: Math.max(page - 1, 0) * pageSize,
  _limit: pageSize,
});

module.exports = {
  getPaginationInfos,
  withDefaultPagination,
  createPaginatedQuery,
  createFindPageQuery,
  createSearchPageQuery,
};
