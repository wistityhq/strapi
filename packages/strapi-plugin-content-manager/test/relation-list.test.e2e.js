'use strict';

// Test a simple default API with no relations

const _ = require('lodash');

const { registerAndLogin } = require('../../../test/helpers/auth');
const createModelsUtils = require('../../../test/helpers/models');
const { createAuthRequest } = require('../../../test/helpers/request');

let rq;
let modelsUtils;
let data = {
  products: [],
  shops: [],
};

const productModel = {
  attributes: {
    name: {
      type: 'string',
    },
  },
  connection: 'default',
  name: 'product',
  description: '',
  collectionName: '',
};

const productWithDPModel = {
  attributes: {
    name: {
      type: 'string',
    },
  },
  connection: 'default',
  name: 'product',
  draftAndPublish: true,
  description: '',
  collectionName: '',
};

const shopModel = {
  attributes: {
    name: {
      type: 'string',
    },
    products: {
      dominant: true,
      nature: 'manyToMany',
      target: 'application::product.product',
      targetAttribute: 'shops',
    },
  },
  connection: 'default',
  name: 'shop',
};

const shops = [
  {
    name: 'market',
  },
];

const products = [
  {
    name: 'tomato',
  },
  {
    name: 'apple',
  },
];

async function createFixtures({ publishAProduct = false } = {}) {
  data.shops = [];
  data.products = [];
  for (const shop of shops) {
    const res = await rq({
      method: 'POST',
      url: 'content-manager/collection-types/application::shop.shop',
      body: shop,
    });
    data.shops.push(res.body);
  }

  for (const product of products) {
    const res = await rq({
      method: 'POST',
      url: 'content-manager/collection-types/application::product.product',
      body: {
        ...product,
        shops: [data.shops[0].id],
      },
    });
    data.products.push(res.body);
  }

  if (publishAProduct) {
    const res = await rq({
      method: 'POST',
      url: `/content-manager/collection-types/application::product.product/${data.products[0].id}/actions/publish`,
    });
    data.products[0] = res.body;
  }
}

async function deleteFixtures() {
  await rq({
    method: 'POST',
    url: '/content-manager/collection-types/application::shop.shop/actions/bulkDelete',
    body: {
      ids: data.shops.map(({ id }) => id),
    },
  });
  await rq({
    method: 'POST',
    url: '/content-manager/collection-types/application::product.product/actions/bulkDelete',
    body: {
      ids: data.products.map(({ id }) => id),
    },
  });
}

describe('Relation-list route', () => {
  beforeAll(async () => {
    const token = await registerAndLogin();
    rq = createAuthRequest(token);

    modelsUtils = createModelsUtils({ rq });
  }, 60000);

  describe('without draftAndPublish', () => {
    beforeAll(async () => {
      await modelsUtils.createContentTypes([productModel, shopModel]);
      await createFixtures();
    }, 60000);

    afterAll(async () => {
      await deleteFixtures();
      await modelsUtils.deleteContentTypes(['product', 'shop']);
    }, 60000);

    test('Can get relation-list for products of a shop', async () => {
      const res = await rq({
        method: 'GET',
        url: '/content-manager/relations/application::shop.shop/products',
      });

      expect(res.body).toHaveLength(data.products.length);
      data.products.forEach((product, index) => {
        expect(res.body[index]).toStrictEqual(_.pick(product, ['_id', 'id', 'name']));
      });
    });
  });

  describe('with draftAndPublish', () => {
    beforeAll(async () => {
      await modelsUtils.createContentTypes([productWithDPModel, shopModel]);
      await createFixtures({ publishAProduct: true });
    }, 60000);

    afterAll(async () => {
      await deleteFixtures();
      await modelsUtils.deleteContentTypes(['product', 'shop']);
    }, 60000);

    test('Can get relation-list for products of a shop', async () => {
      const res = await rq({
        method: 'GET',
        url: '/content-manager/relations/application::shop.shop/products',
      });

      expect(res.body).toHaveLength(data.products.length);

      const tomatoProductRes = res.body.find(p => p.name === 'tomato');
      const appleProductRes = res.body.find(p => p.name === 'apple');

      expect(tomatoProductRes).toMatchObject(_.pick(data.products[0], ['_id', 'id', 'name']));
      expect(tomatoProductRes.published_at).toBeISODate();
      expect(appleProductRes).toStrictEqual({
        ..._.pick(data.products[1], ['_id', 'id', 'name']),
        published_at: null,
      });
    });
  });
});
