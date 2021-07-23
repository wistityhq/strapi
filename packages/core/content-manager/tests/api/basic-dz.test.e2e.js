'use strict';

const _ = require('lodash');

const { createTestBuilder } = require('../../../../../test/helpers/builder');
const { createStrapiInstance } = require('../../../../../test/helpers/strapi');
const { createAuthRequest } = require('../../../../../test/helpers/request');

const builder = createTestBuilder();
let strapi;
let rq;
let data = {
  productsWithDz: [],
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

const productWithDz = {
  attributes: {
    name: {
      type: 'string',
    },
    description: {
      type: 'text',
    },
    dz: {
      components: ['default.compo'],
      type: 'dynamiczone',
      required: true,
    },
  },
  name: 'product with dz',
  description: '',
  collectionName: '',
};

describe('Core API - Basic + dz', () => {
  beforeAll(async () => {
    await builder
      .addComponent(compo)
      .addContentType(productWithDz)
      .build();

    strapi = await createStrapiInstance();
    rq = await createAuthRequest({ strapi });
  });

  afterAll(async () => {
    await strapi.destroy();
    await builder.cleanup();
  });

  test('Create product with compo', async () => {
    const product = {
      name: 'Product 1',
      description: 'Product description',
      dz: [
        {
          __component: 'default.compo',
          name: 'compo name',
          description: 'short',
        },
      ],
    };
    const res = await rq({
      method: 'POST',
      url: '/content-manager/collection-types/application::product-with-dz.product-with-dz',
      body: product,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(product);
    expect(res.body.published_at).toBeUndefined();
    data.productsWithDz.push(res.body);
  });

  test('Read product with compo', async () => {
    const res = await rq({
      method: 'GET',
      url: '/content-manager/collection-types/application::product-with-dz.product-with-dz',
    });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0]).toMatchObject(data.productsWithDz[0]);
    res.body.results.forEach(p => expect(p.published_at).toBeUndefined());
  });

  test('Update product with compo', async () => {
    const product = {
      name: 'Product 1 updated',
      description: 'Updated Product description',
      dz: [
        {
          __component: 'default.compo',
          name: 'compo name updated',
          description: 'update',
        },
      ],
    };
    const res = await rq({
      method: 'PUT',
      url: `/content-manager/collection-types/application::product-with-dz.product-with-dz/${data.productsWithDz[0].id}`,
      body: product,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(product);
    expect(res.body.id).toEqual(data.productsWithDz[0].id);
    expect(res.body.published_at).toBeUndefined();
    data.productsWithDz[0] = res.body;
  });

  test('Delete product with compo', async () => {
    const res = await rq({
      method: 'DELETE',
      url: `/content-manager/collection-types/application::product-with-dz.product-with-dz/${data.productsWithDz[0].id}`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(data.productsWithDz[0]);
    expect(res.body.id).toEqual(data.productsWithDz[0].id);
    expect(res.body.published_at).toBeUndefined();
    data.productsWithDz.shift();
  });

  describe('validation', () => {
    test('Cannot create product with compo - compo required', async () => {
      const product = {
        name: 'Product 1',
        description: 'Product description',
      };
      const res = await rq({
        method: 'POST',
        url: '/content-manager/collection-types/application::product-with-dz.product-with-dz',
        body: product,
      });

      expect(res.statusCode).toBe(400);
      expect(_.get(res.body.data, ['errors', 'dz', '0'])).toBe('dz must be defined.');
    });

    test('Cannot create product with compo - minLength', async () => {
      const product = {
        name: 'Product 1',
        description: 'Product description',
        dz: [
          {
            __component: 'default.compo',
            name: 'compo name',
            description: '',
          },
        ],
      };
      const res = await rq({
        method: 'POST',
        url: '/content-manager/collection-types/application::product-with-dz.product-with-dz',
        body: product,
      });

      expect(res.statusCode).toBe(400);
      expect(_.get(res.body.data, ['errors', 'dz[0].description', '0'])).toBe(
        'dz[0].description must be at least 3 characters'
      );
    });

    test('Cannot create product with compo - maxLength', async () => {
      const product = {
        name: 'Product 1',
        description: 'Product description',
        dz: [
          {
            __component: 'default.compo',
            name: 'compo name',
            description: 'A very long description that exceed the min length.',
          },
        ],
      };
      const res = await rq({
        method: 'POST',
        url: '/content-manager/collection-types/application::product-with-dz.product-with-dz',
        body: product,
      });

      expect(res.statusCode).toBe(400);
      expect(_.get(res.body.data, ['errors', 'dz[0].description', '0'])).toBe(
        'dz[0].description must be at most 10 characters'
      );
    });

    test('Cannot create product with compo - required', async () => {
      const product = {
        name: 'Product 1',
        description: 'Product description',
        dz: [
          {
            __component: 'default.compo',
            description: 'short',
          },
        ],
      };
      const res = await rq({
        method: 'POST',
        url: '/content-manager/collection-types/application::product-with-dz.product-with-dz',
        body: product,
      });

      expect(res.statusCode).toBe(400);
      expect(_.get(res.body.data, ['errors', 'dz[0].name', '0'])).toBe(
        'dz[0].name must be defined.'
      );
    });

    test('Cannot create product with compo - missing __component', async () => {
      const product = {
        name: 'Product 1',
        description: 'Product description',
        dz: [
          {
            name: 'Product 1',
            description: 'short',
          },
        ],
      };
      const res = await rq({
        method: 'POST',
        url: '/content-manager/collection-types/application::product-with-dz.product-with-dz',
        body: product,
      });

      expect(res.statusCode).toBe(400);
      expect(_.get(res.body.data, ['errors', 'dz[0].__component', '0'])).toBe(
        'dz[0].__component is a required field'
      );
    });
  });
});
