'use strict';

const _ = require('lodash');

const { createStrapiInstance } = require('../../../../../test/helpers/strapi');
const { createTestBuilder } = require('../../../../../test/helpers/builder');
const { createAuthRequest } = require('../../../../../test/helpers/request');

const builder = createTestBuilder();
let strapi;
let rq;
let data = {
  products: [],
};

const compo = {
  name: 'compo',
  attributes: {
    name: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'text',
      minLength: 3,
      maxLength: 10,
    },
  },
};

const productWithDP = {
  attributes: {
    name: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'text',
      minLength: 3,
      maxLength: 30,
    },
  },
  draftAndPublish: true,
  name: 'product-with-dp',
  description: '',
  collectionName: '',
};

describe('Core API - Basic + draftAndPublish', () => {
  beforeAll(async () => {
    await builder
      .addComponent(compo)
      .addContentType(productWithDP)
      .build();

    strapi = await createStrapiInstance();
    rq = await createAuthRequest({ strapi });
  });

  afterAll(async () => {
    await strapi.destroy();
    await builder.cleanup();
  });

  test('Create a product', async () => {
    const product = {
      name: 'Product 1',
      description: 'Product description',
    };
    const res = await rq({
      method: 'POST',
      url: '/product-with-dps',
      body: product,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(product);
    expect(res.body.published_at).toBeISODate();
    data.products.push(res.body);
  });

  test('Create a product + can overwrite published_at', async () => {
    const product = {
      name: 'Product 2',
      description: 'Product description',
      published_at: '2020-08-20T10:27:55.000Z',
    };
    const res = await rq({
      method: 'POST',
      url: '/product-with-dps',
      body: product,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(_.omit(product, 'published_at'));
    expect(res.body.published_at).toBeISODate();
    expect(res.body.published_at).toBe(product.published_at);
    data.products.push(res.body);
  });

  test('Read products', async () => {
    const res = await rq({
      method: 'GET',
      url: '/product-with-dps',
    });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Product 1',
          description: 'Product description',
        }),
      ])
    );
    res.body.forEach(p => {
      expect(p.published_at).toBeISODate();
    });
  });

  test('Update product', async () => {
    const product = {
      name: 'Product 1 updated',
      description: 'Updated Product description',
    };
    const res = await rq({
      method: 'PUT',
      url: `/product-with-dps/${data.products[0].id}`,
      body: product,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(_.omit(product, 'published_at'));
    expect(res.body.id).toEqual(data.products[0].id);
    expect(res.body.published_at).toBeISODate();
    data.products[0] = res.body;
  });

  test('Update product + can overwrite published_at', async () => {
    const product = {
      name: 'Product 1 updated',
      description: 'Updated Product description',
      published_at: '2020-08-27T09:50:50.000Z',
    };
    const res = await rq({
      method: 'PUT',
      url: `/product-with-dps/${data.products[0].id}`,
      body: product,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(_.pick(data.products[0], ['name', 'description']));
    expect(res.body.published_at).toBeISODate();
    expect(res.body.published_at).toBe(product.published_at);
    data.products[0] = res.body;
  });

  test('Delete product', async () => {
    const res = await rq({
      method: 'DELETE',
      url: `/product-with-dps/${data.products[0].id}`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(data.products[0]);
    expect(res.body.id).toEqual(data.products[0].id);
    expect(res.body.published_at).toBeISODate();
    data.products.shift();
  });

  describe('validators', () => {
    test('Cannot create a product - minLength', async () => {
      const product = {
        name: 'Product 1',
        description: '',
      };
      const res = await rq({
        method: 'POST',
        url: '/product-with-dps',
        body: product,
      });

      expect(res.statusCode).toBe(400);
      expect(_.get(res, 'body.data.errors.description.0')).toBe(
        'description must be at least 3 characters'
      );
    });

    test('Cannot create a product - required', async () => {
      const product = {
        description: 'Product description',
      };
      const res = await rq({
        method: 'POST',
        url: '/product-with-dps',
        body: product,
      });

      expect(res.statusCode).toBe(400);
      expect(_.get(res, 'body.data.errors.name.0')).toBe('name must be defined.');
    });

    test('Cannot create a product - maxLength', async () => {
      const product = {
        name: 'Product 1',
        description: "I'm a product description that is very long. At least thirty characters.",
      };
      const res = await rq({
        method: 'POST',
        url: '/product-with-dps',
        body: product,
      });

      expect(res.statusCode).toBe(400);
      expect(_.get(res.body.data, ['errors', 'description', '0'])).toBe(
        'description must be at most 30 characters'
      );
    });
  });
});
