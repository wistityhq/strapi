'use strict';

// Test a simple default API with no relations

const _ = require('lodash');

const { createTestBuilder } = require('../../../../../test/helpers/builder');
const { createStrapiInstance } = require('../../../../../test/helpers/strapi');
const { createAuthRequest } = require('../../../../../test/helpers/request');

const builder = createTestBuilder();
let strapi;
let rq;
let data = {
  productsWithDzAndDP: [],
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
      minLength: 4,
      maxLength: 30,
    },
  },
};

const productWithCompoAndDP = {
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
  draftAndPublish: true,
  name: 'product with dz and DP',
  description: '',
  collectionName: '',
};

describe('CM API - Basic + dz + draftAndPublish', () => {
  beforeAll(async () => {
    await builder
      .addComponent(compo)
      .addContentType(productWithCompoAndDP)
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
      url:
        '/content-manager/collection-types/application::product-with-dz-and-dp.product-with-dz-and-dp',
      body: product,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(product);
    expect(res.body.published_at).toBeNull();
    data.productsWithDzAndDP.push(res.body);
  });

  test('Read product with compo', async () => {
    const res = await rq({
      method: 'GET',
      url:
        '/content-manager/collection-types/application::product-with-dz-and-dp.product-with-dz-and-dp',
    });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0]).toMatchObject(data.productsWithDzAndDP[0]);
    res.body.results.forEach(p => {
      expect(p.published_at).toBeNull();
    });
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
      url: `/content-manager/collection-types/application::product-with-dz-and-dp.product-with-dz-and-dp/${data.productsWithDzAndDP[0].id}`,
      body: product,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(product);
    expect(res.body.id).toEqual(data.productsWithDzAndDP[0].id);
    expect(res.body.published_at).toBeNull();
    data.productsWithDzAndDP[0] = res.body;
  });

  test('Delete product with compo', async () => {
    const res = await rq({
      method: 'DELETE',
      url: `/content-manager/collection-types/application::product-with-dz-and-dp.product-with-dz-and-dp/${data.productsWithDzAndDP[0].id}`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(data.productsWithDzAndDP[0]);
    expect(res.body.id).toEqual(data.productsWithDzAndDP[0].id);
    expect(res.body.published_at).toBeNull();
    data.productsWithDzAndDP.shift();
  });

  describe('validation', () => {
    describe.each(['create', 'update'])('%p', method => {
      test(`Can ${method} product with compo - compo required - []`, async () => {
        const product = {
          name: 'Product 1',
          description: 'Product description',
          dz: [],
        };
        const res = await rq({
          method: method === 'create' ? 'POST' : 'PUT',
          url: `/content-manager/collection-types/application::product-with-dz-and-dp.product-with-dz-and-dp/${
            method === 'update' ? data.productsWithDzAndDP[0].id : ''
          }`,
          body: product,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject(product);
        data.productsWithDzAndDP.push(res.body);
      });

      test(`Can ${method} product with compo - minLength`, async () => {
        const product = {
          name: 'Product 1',
          description: 'Product description',
          dz: [
            {
              __component: 'default.compo',
              name: 'compo name',
              description: 'k',
            },
          ],
        };
        const res = await rq({
          method: method === 'create' ? 'POST' : 'PUT',
          url: `/content-manager/collection-types/application::product-with-dz-and-dp.product-with-dz-and-dp/${
            method === 'update' ? data.productsWithDzAndDP[0].id : ''
          }`,
          body: product,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject(product);
        data.productsWithDzAndDP.push(res.body);
      });

      test(`Cannot ${method} product with compo - maxLength`, async () => {
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
          method: method === 'create' ? 'POST' : 'PUT',
          url: `/content-manager/collection-types/application::product-with-dz-and-dp.product-with-dz-and-dp/${
            method === 'update' ? data.productsWithDzAndDP[0].id : ''
          }`,
          body: product,
        });

        expect(res.statusCode).toBe(400);
        expect(_.get(res.body.data, ['errors', 'dz[0].description', '0'])).toBe(
          'dz[0].description must be at most 30 characters'
        );
      });

      test(`Can ${method} product with compo - required`, async () => {
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
          method: method === 'create' ? 'POST' : 'PUT',
          url: `/content-manager/collection-types/application::product-with-dz-and-dp.product-with-dz-and-dp/${
            method === 'update' ? data.productsWithDzAndDP[0].id : ''
          }`,
          body: product,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject(product);
        data.productsWithDzAndDP.push(res.body);
      });

      test(`Cannot ${method} product with compo - missing __component`, async () => {
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
          method: method === 'create' ? 'POST' : 'PUT',
          url: `/content-manager/collection-types/application::product-with-dz-and-dp.product-with-dz-and-dp/${
            method === 'update' ? data.productsWithDzAndDP[0].id : ''
          }`,
          body: product,
        });

        expect(res.statusCode).toBe(400);
        expect(_.get(res.body.data, ['errors', 'dz[0].__component', '0'])).toBe(
          'dz[0].__component is a required field'
        );
      });
    });
  });
});
