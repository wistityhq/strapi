'use strict';

const { createStrapiInstance } = require('../../../../../test/helpers/strapi');
const { createTestBuilder } = require('../../../../../test/helpers/builder');
const { createAuthRequest } = require('../../../../../test/helpers/request');

const builder = createTestBuilder();
let strapi;
let rq;
let data = {
  product: [],
};

const product = {
  attributes: {
    name: {
      type: 'string',
    },
    description: {
      type: 'text',
    },
  },
  name: 'product',
  description: '',
  collectionName: '',
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

describe('Core API - Basic', () => {
  beforeAll(async () => {
    await builder
      .addComponent(compo)
      .addContentType(product)
      .build();

    strapi = await createStrapiInstance();
    rq = await createAuthRequest({ strapi });
  });

  afterAll(async () => {
    await strapi.destroy();
    await builder.cleanup();
  });

  test('Create product', async () => {
    const product = {
      name: 'Product 1',
      description: 'Product description',
    };
    const res = await rq({
      method: 'POST',
      url: '/products',
      body: product,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(product);
    expect(res.body.published_at).toBeUndefined();
    data.product.push(res.body);
  });

  test('Read product', async () => {
    const res = await rq({
      method: 'GET',
      url: '/products',
    });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Product 1',
          description: 'Product description',
        }),
      ])
    );
    res.body.forEach(p => expect(p.published_at).toBeUndefined());
  });

  test('Update product', async () => {
    const product = {
      name: 'Product 1 updated',
      description: 'Updated Product description',
    };
    const res = await rq({
      method: 'PUT',
      url: `/products/${data.product[0].id}`,
      body: product,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(product);
    expect(res.body.id).toEqual(data.product[0].id);
    expect(res.body.published_at).toBeUndefined();
    data.product[0] = res.body;
  });

  test('Delete product', async () => {
    const res = await rq({
      method: 'DELETE',
      url: `/products/${data.product[0].id}`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(data.product[0]);
    expect(res.body.id).toEqual(data.product[0].id);
    expect(res.body.published_at).toBeUndefined();
    data.product.shift();
  });
});
