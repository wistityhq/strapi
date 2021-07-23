'use strict';

const { prop, difference, map, uniq } = require('lodash/fp');
const { createAuthRequest } = require('../../../../../test/helpers/request');
const { createStrapiInstance } = require('../../../../../test/helpers/strapi');
const { createTestBuilder } = require('../../../../../test/helpers/builder');

const toIds = arr => uniq(map(prop('id'))(arr));

let strapi;
let rq;
const builder = createTestBuilder();

const data = {
  product: [],
  category: [],
  shop: [],
};

const productModel = {
  attributes: {
    name: {
      type: 'string',
      unique: true,
    },
    categories: {
      type: 'relation',
      relation: 'oneToMany',
      target: 'application::category.category',
      targetAttribute: 'product',
    },
    shops: {
      type: 'relation',
      relation: 'oneToMany',
      target: 'application::shop.shop',
    },
  },
  name: 'product',
};

const categoryModel = {
  attributes: {
    name: {
      type: 'string',
      unique: true,
    },
  },
  name: 'category',
};

const shopModel = {
  attributes: {
    name: {
      type: 'string',
      unique: true,
    },
    metadata: {
      type: 'string',
    },
  },
  name: 'shop',
};

const PRODUCT_SHOP_COUNT = 12;
const PRODUCT_CATEGORY_COUNT = 5;
const fixtures = {
  shop: [
    { name: 'SH.A', metadata: 'foobar' },
    { name: 'SH.B', metadata: 'foobar' },
    { name: 'SH.C', metadata: 'foobar' },
    { name: 'SH.D', metadata: 'foobar' },
    { name: 'SH.E', metadata: 'foobar' },
    { name: 'SH.F', metadata: 'foobar' },
    { name: 'SH.G', metadata: 'foobar' },
    { name: 'SH.H', metadata: 'foobar' },
    { name: 'SH.I', metadata: 'foobar' },
    { name: 'SH.J', metadata: 'foobar' },
    { name: 'SH.K', metadata: 'foobar' },
    { name: 'SH.L', metadata: 'foobar' },
  ],
  category: [
    { name: 'CT.A' },
    { name: 'CT.B' },
    { name: 'CT.C' },
    { name: 'CT.D' },
    { name: 'CT.E' },
    { name: 'CT.F' },
    { name: 'CT.G' },
    { name: 'CT.H' },
    { name: 'CT.I' },
    { name: 'CT.J' },
    { name: 'CT.K' },
    { name: 'CT.L' },
  ],
  product: ({ shop, category }) => [
    {
      name: 'PD.A',
      categories: category.slice(0, PRODUCT_CATEGORY_COUNT).map(prop('id')),
      shops: shop.slice(0, PRODUCT_SHOP_COUNT).map(prop('id')),
    },
  ],
};

const getUID = modelName => `application::${modelName}.${modelName}`;
const getCMPrefixUrl = modelName => `/content-manager/collection-types/${getUID(modelName)}`;

describe('x-to-many RF Preview', () => {
  const cmProductUrl = getCMPrefixUrl(productModel.name);

  beforeAll(async () => {
    await builder
      .addContentTypes([shopModel, categoryModel, productModel])
      .addFixtures(shopModel.name, fixtures.shop)
      .addFixtures(categoryModel.name, fixtures.category)
      .addFixtures(productModel.name, fixtures.product)
      .build();

    strapi = await createStrapiInstance();
    rq = await createAuthRequest({ strapi });

    Object.assign(data, builder.sanitizedFixtures(strapi));
  });

  afterAll(async () => {
    await strapi.destroy();
    await builder.cleanup();
  });

  describe('Entity Misc', () => {
    test.each(['foobar', 'name'])(`Throws if the targeted field is invalid (%s)`, async field => {
      const product = data.product[0];
      const { body, statusCode } = await rq.get(`${cmProductUrl}/${product.id}/${field}`);

      expect(statusCode).toBe(400);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Invalid target field');
    });

    test('Throws if the entity does not exist', async () => {
      const { body, statusCode } = await rq.get(`${cmProductUrl}/${data.shop[11].id}/categories`);

      expect(statusCode).toBe(404);
      expect(body.error).toBe('Not Found');
    });
  });

  describe('Relation Nature', () => {
    test(`Throws if the relation's nature is not a x-to-many`, async () => {
      const url = getCMPrefixUrl(categoryModel.name);
      const id = data.category[0].id;

      const { body, statusCode } = await rq.get(`${url}/${id}/product`);

      expect(statusCode).toBe(400);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Invalid target field');
    });
  });

  describe('Default Behavior', () => {
    test('Should return a preview for the shops field', async () => {
      const product = data.product[0];

      const { body, statusCode } = await rq.get(`${cmProductUrl}/${product.id}/shops`);

      expect(statusCode).toBe(200);
      expect(body.results).toHaveLength(10);
      expect(difference(toIds(body.results), toIds(data.shop))).toHaveLength(0);
    });

    test('Should return a preview for the categories field', async () => {
      const product = data.product[0];

      const { body, statusCode } = await rq.get(`${cmProductUrl}/${product.id}/categories`);

      expect(statusCode).toBe(200);
      expect(body.results).toHaveLength(5);
      expect(difference(toIds(body.results), toIds(data.category))).toHaveLength(0);
    });
  });

  describe('Pagination', () => {
    test.each([
      [1, 10],
      [2, 10],
      [5, 1],
      [4, 2],
      [1, 100],
    ])('Custom pagination (%s, %s)', async (page, pageSize) => {
      const product = data.product[0];

      const { body, statusCode } = await rq.get(
        `${cmProductUrl}/${product.id}/shops?page=${page}&pageSize=${pageSize}`
      );

      expect(statusCode).toBe(200);

      const { pagination, results } = body;

      expect(pagination.page).toBe(page);
      expect(pagination.pageSize).toBe(pageSize);
      expect(results).toHaveLength(Math.min(pageSize, PRODUCT_SHOP_COUNT - pageSize * (page - 1)));
    });
  });
});
