/**
 * @jest-environment node
 */
'use strict';

const queries = require('../queries');

const strapi = {};
const model = {
  primaryKey: '_id',
  associations: [],
  attributes: {},
};

describe('Mongo invalid primaryKey Queries', () => {
  test('should return null for findOne', async () => {
    const { findOne } = queries({ model, strapi });
    let data;

    try {
      data = await findOne({ _id: '123' });
    } finally {
      expect(data).toBeNull();
    }
  });

  test('should return null for update', async () => {
    const { update } = queries({ model, strapi });
    let data;

    try {
      data = await update({ _id: '123' });
    } finally {
      expect(data).toBeNull();
    }
  });

  test('should return null for delete', async () => {
    const { delete: deleteMany } = queries({ model, strapi });
    let data;

    try {
      data = await deleteMany({ _id: '123' });
    } finally {
      expect(data).toBeNull();
    }
  });
});
