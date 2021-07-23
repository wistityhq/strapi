'use strict';

// Test an API with all the possible filed types and simple filtering (no deep filtering, no relations)

const { createStrapiInstance } = require('../../../../test/helpers/strapi');
const { createTestBuilder } = require('../../../../test/helpers/builder');
const { createAuthRequest } = require('../../../../test/helpers/request');

const builder = createTestBuilder();
let strapi;
let rq;
const data = { product: [] };

// complete list of existing fields and tests
const product = {
  attributes: {
    name: {
      type: 'string',
    },
    description: {
      type: 'text',
    },
    price: {
      type: 'float',
    },
    decimal_field: {
      type: 'decimal',
    },
    rank: {
      type: 'integer',
    },
    big_rank: {
      type: 'biginteger',
    },
  },
  name: 'product',
  description: '',
  collectionName: '',
};

const productFixtures = [
  {
    name: 'Product 1',
    description: 'Product description',
    price: 10.99,
    decimal_field: 42.43,
    rank: 42,
    big_rank: '345678912983',
  },
  {
    name: 'Product 2',
    description: 'Product description 2',
    price: 28.31,
    decimal_field: 91.22,
    rank: 82,
    big_rank: '926371623421',
  },
  {
    name: 'Product 3',
    description: 'Product description 3',
    price: 28.31,
    decimal_field: 12.22,
    rank: 91,
    big_rank: '926372323421',
  },
  {
    name: 'Product 4',
    description: 'Product description 4',
    price: null,
    decimal_field: 12.22,
    rank: 99,
    big_rank: '999999999999',
  },
  {
    name: 'Продукт 5, Product 5',
    description: 'Опис на продукт 5',
    price: null,
    decimal_field: 142.43,
    rank: 142,
    big_rank: 345678912983,
  },
];

describe('Filtering API', () => {
  beforeAll(async () => {
    await builder
      .addContentType(product)
      .addFixtures(product.name, productFixtures)
      .build();

    strapi = await createStrapiInstance();
    rq = await createAuthRequest({ strapi });

    Object.assign(data, builder.sanitizedFixtures(strapi));
  });

  afterAll(async () => {
    await strapi.destroy();
    await builder.cleanup();
  });

  describe('Basic filters', () => {
    describe('Filter equals', () => {
      test('Should be the default filter', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              name: 'Product 1',
            },
          },
        });

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0]).toMatchObject(data.product[0]);
      });

      test('Should be usable with equal suffix', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              name: {
                $eq: 'Product 1',
              },
            },
          },
        });

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0]).toMatchObject(data.product[0]);
      });

      test('Should return an empty array when no match', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              name: {
                $eq: 'Product non existant',
              },
            },
          },
        });

        expect(res.body).toEqual([]);
      });
    });

    describe('Filter not equals', () => {
      test('Should return an array with matching entities', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              name: {
                $ne: 'Non existent product ',
              },
            },
          },
        });

        expect(res.body).toEqual(
          expect.arrayContaining(data.product.map(o => expect.objectContaining(o)))
        );
      });

      test('Should return an empty array when no match', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              name: {
                $ne: 'Product 1',
              },
            },
          },
        });

        expect(res.body).toEqual(expect.not.arrayContaining([data.product[0]]));
      });
    });

    describe('Filter null', () => {
      test('Should return only matching items', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              price: { $null: true },
            },
          },
        });

        const matching = data.product.filter(x => x.price === null);
        res.body.sort((a, b) => (a.id > b.id ? 1 : -1));
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(matching.length);
        expect(res.body).toEqual(expect.arrayContaining(matching));
      });

      test('Should return three matches', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              price: {
                $notNull: true,
              },
            },
          },
        });

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(3);
      });
    });

    describe('Filter contains insensitive', () => {
      test('Should match with insensitive case', async () => {
        const res1 = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              name: {
                $contains: 'product',
              },
            },
          },
        });

        expect(res1.body).toEqual(
          expect.arrayContaining(data.product.map(o => expect.objectContaining(o)))
        );

        const res2 = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              name: {
                $contains: 'PrOdUct',
              },
            },
          },
        });

        expect(res1.body).toEqual(res2.body);
      });

      test('Should return an empty array on no insensitive case match', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              name: {
                $contains: 'production',
              },
            },
          },
        });

        expect(res.body).toEqual([]);

        const res2 = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              name: {
                $contains: 'ProdUctIon',
              },
            },
          },
        });

        expect(res2.body).toEqual(res.body);
      });
    });

    describe('Filter not contains insensitive', () => {
      test('Should return an array of entities on match', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              name: {
                $notContains: 'production',
              },
            },
          },
        });

        expect(res.body).toEqual(
          expect.arrayContaining(data.product.map(o => expect.objectContaining(o)))
        );

        const res2 = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              name: { $notContains: 'ProdUctIon' },
            },
          },
        });

        expect(res2.body).toEqual(res.body);
      });

      test('Should return an empty array when no match', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              name: { $notContains: 'product' },
            },
          },
        });

        expect(res.body).toEqual([]);

        const res2 = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              name: { $notContains: 'ProDuCt' },
            },
          },
        });

        expect(res2.body).toEqual(res.body);
      });
    });

    // FIXME: Not working on sqlite due to https://www.sqlite.org/draft/pragma.html#pragma_case_sensitive_like
    describe('Filter contains sensitive', () => {
      test.skip('Should return empty if the case does not match', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              name: {
                $contains: 'product',
              },
            },
          },
        });

        expect(res.body).toEqual([]);
      });

      test('Should return the entities if the case matches', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              name: {
                $contains: 'Product',
              },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
      });
    });

    // FIXME: Not working on sqlite due to https://www.sqlite.org/draft/pragma.html#pragma_case_sensitive_like
    describe('Filter not contains sensitive', () => {
      test.skip('Should return the entities if the case does not match', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              name: {
                $contains: 'product',
              },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
      });

      test('Should return an empty array if the case matches', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              name: {
                $notContains: 'Product',
              },
            },
          },
        });

        expect(res.body).toEqual([]);
      });
    });

    describe('Filter in', () => {
      test('Should return the Product with a single value', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              rank: { $in: 42 },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
      });

      test('Should return the Product with an array of values', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              rank: { $in: [42, 12] },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
      });

      test('Should return a, empty array if no values are matching', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              rank: { $in: [43, 12] },
            },
          },
        });

        expect(res.body).toEqual([]);
      });
    });

    describe('Filter not in', () => {
      test('Should return an array without the values matching when a single value is provided', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              rank: { $notIn: 42 },
            },
          },
        });

        expect(res.body).toEqual(expect.not.arrayContaining([data.product[0]]));
      });

      test('Should return an array without the values matching when an array of values is provided', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              rank: { $notIn: [42, 12] },
            },
          },
        });

        expect(res.body).toEqual(expect.not.arrayContaining([data.product[0]]));
      });

      test('Should return an array with values that do not match the filter', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              rank: { $notIn: [43, 12] },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
      });
    });

    describe('Filter greater than', () => {
      test('Should match values only greater than', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              rank: { $gt: 42 },
            },
          },
        });

        expect(res.body).toEqual(expect.not.arrayContaining([data.product[0]]));

        const res2 = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              rank: { $gt: 40 },
            },
          },
        });

        expect(res2.body).toEqual(expect.arrayContaining([data.product[0]]));
      });

      test('Should work with integers', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              rank: { $gt: 40 },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
      });

      test('Should work with float', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              price: { $gt: 9.3 },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
      });

      test('Should work with decimal', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              decimal_field: { $gt: 1.23 },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
      });

      test('Should work with bigintegers', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              big_rank: { $gt: 34567891298 },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
      });
    });

    describe('Filter greater than or equal', () => {
      test('Should work correclty on equal values', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              rank: { $gte: 42 },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));

        const res2 = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              rank: { $gte: 43 },
            },
          },
        });

        expect(res2.body).toEqual(expect.not.arrayContaining([data.product[0]]));
      });

      test('Should work with integers', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              rank: { $gte: 40 },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
      });

      test('Should work with float', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              price: { $gte: 10.99 },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
      });

      test('Should work with decimal', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              decimal_field: { $gte: 42.43 },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
      });

      test('Should work with bigintegers', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              big_rank: { $gte: '345678912983' },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
      });
    });

    describe('Filter less than', () => {
      test('Should match values only less than', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              rank: { $lt: 42 },
            },
          },
        });

        expect(res.body).toEqual(expect.not.arrayContaining([data.product[0]]));

        const res2 = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              rank: { $lt: 43 },
            },
          },
        });

        expect(res2.body).toEqual(expect.arrayContaining([data.product[0]]));
      });

      test('Should work with integers', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              rank: { $lt: 45 },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
      });

      test('Should work with float', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              price: { $lt: 21.3 },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
      });

      test('Should work with decimal', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              decimal_field: { $lt: 46.23 },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
      });

      test('Should work with bigintegers', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              big_rank: { $lt: 3456789129812 },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
      });
    });

    describe('Filter less than or equal', () => {
      test('Should work correclty on equal values', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              rank: { $lte: 52 },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));

        const res2 = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              rank: { $lte: 21 },
            },
          },
        });

        expect(res2.body).toEqual(expect.not.arrayContaining([data.product[0]]));
      });

      test('Should work with integers', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              rank: { $lte: 42 },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
      });

      test('Should work with float', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              price: { $lte: 10.99 },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
      });

      test('Should work with decimal', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              decimal_field: { $lte: 42.43 },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
      });

      test('Should work with bigintegers', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              big_rank: { $lte: '345678912983' },
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
      });
    });
  });

  describe('Or filtering', () => {
    describe('$or filter', () => {
      test('Supports simple or', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              $or: [
                {
                  rank: 42,
                },
                {
                  rank: 82,
                },
              ],
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0], data.product[1]]));
      });

      test('Supports simple or on different fields', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              $or: [
                {
                  rank: 42,
                },
                {
                  price: { $gt: 28 },
                },
              ],
            },
          },
        });

        expect(res.body).toEqual(
          expect.arrayContaining([data.product[0], data.product[1], data.product[2]])
        );
      });

      test('Supports or with nested and', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              $or: [
                {
                  rank: 42,
                },
                [
                  {
                    price: { $gt: 28 },
                  },
                  {
                    rank: 91,
                  },
                ],
              ],
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0], data.product[2]]));
      });

      test('Supports or with nested or', async () => {
        const res = await rq({
          method: 'GET',
          url: '/products',
          qs: {
            filters: {
              $or: [
                {
                  rank: 42,
                },
                [
                  {
                    price: { $gt: 28 },
                  },
                  {
                    $or: [{ rank: 91 }],
                  },
                ],
              ],
            },
          },
        });

        expect(res.body).toEqual(expect.arrayContaining([data.product[0], data.product[2]]));
      });
    });
  });

  describe('Implict or', () => {
    test('Filter equals', async () => {
      const res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          filters: {
            rank: [42, 43],
          },
        },
      });

      expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
    });

    test('Filter not equals', async () => {
      const res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          filters: {
            rank: { $ne: [41, 43] },
          },
        },
      });

      expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
    });

    test.skip('Filter contains insensitive', async () => {
      const res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          filters: {
            name: {
              $contains: ['Product', '1'],
            },
          },
        },
      });

      expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
    });

    test.skip('Filter not contains insensitive', async () => {
      const res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          filters: {
            name: {
              $notContains: ['Product', 'Non existent'],
            },
          },
        },
      });

      expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
    });

    test('Filter contains sensitive', async () => {
      const res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          filters: {
            name: {
              $contains: ['Product', 'Non existent'],
            },
          },
        },
      });

      expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
    });

    test('Filter not contains sensitive', async () => {
      const res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          filters: {
            name: {
              $notContains: ['product', 'Non existent'],
            },
          },
        },
      });

      expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
    });

    test('Filter greater than', async () => {
      const res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          filters: {
            rank: { $gt: [12, 56] },
          },
        },
      });

      expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
    });

    test('Filter greater than or equal', async () => {
      const res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          filters: {
            rank: {
              $gte: [42, 56],
            },
          },
        },
      });

      expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
    });

    test('Filter less than', async () => {
      const res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          filters: {
            rank: { $lt: [56, 12] },
          },
        },
      });

      expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
    });

    test('Filter less than or equal', async () => {
      const res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          filters: {
            rank: { $lte: [12, 42] },
          },
        },
      });

      expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
    });
  });

  describe('Complexe filtering', () => {
    test('Greater than and less than at the same time', async () => {
      let res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          filters: {
            rank: {
              $lte: 42,
              $gte: 42,
            },
          },
        },
      });

      expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));

      res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          filters: {
            rank: {
              $lt: 43,
              $gt: 41,
            },
          },
        },
      });

      expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));

      res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          filters: {
            rank: { $lt: 43, $gt: 431 },
          },
        },
      });

      expect(res.body).toEqual([]);
    });

    test('Contains and Not contains on same column', async () => {
      let res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          filters: {
            name: {
              $contains: 'Product',
              $notContains: '1',
            },
          },
        },
      });

      expect(res.body).toEqual(expect.arrayContaining(data.product.slice(1)));

      res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          filters: {
            name: {
              $contains: 'Product 1',
              $notContains: ['2', '3'],
            },
          },
        },
      });

      expect(res.body).toEqual(expect.not.arrayContaining([data.product[1], data.product[2]]));
      expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));

      res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          filters: {
            name: {
              $contains: '2',
              $notContains: 'Product',
            },
          },
        },
      });

      expect(res.body).toEqual([]);
    });

    test('Combined filters', async () => {
      let res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          filters: {
            name: {
              $contains: 'Product',
            },
            rank: {
              $lt: 45,
            },
          },
        },
      });

      expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
    });
  });

  describe('Sorting', () => {
    test('Default sorting is asc', async () => {
      const res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          sort: 'rank',
        },
      });

      expect(res.body).toEqual(
        expect.arrayContaining(data.product.slice(0).sort((a, b) => a.rank - b.rank))
      );
    });

    test('Simple sorting', async () => {
      const res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          sort: 'rank:asc',
        },
      });

      expect(res.body).toEqual(
        expect.arrayContaining(data.product.slice(0).sort((a, b) => a.rank - b.rank))
      );

      const res2 = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          sort: 'rank:desc',
        },
      });

      expect(res2.body).toEqual(
        expect.arrayContaining(data.product.slice(0).sort((a, b) => b.rank - a.rank))
      );
    });

    test('Multi column sorting', async () => {
      const res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          sort: 'price:asc,rank:desc',
        },
      });

      [data.product[3], data.product[0], data.product[2], data.product[1]].forEach(expectedPost => {
        expect(res.body).toEqual(expect.arrayContaining([expectedPost]));
      });
    });
  });

  describe('Limit and offset', () => {
    test('Limit', async () => {
      const res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          limit: 1,
          sort: 'rank:asc',
        },
      });

      expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
    });

    test('Limit with sorting', async () => {
      const res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          limit: 1,
          sort: 'rank:desc',
        },
      });

      expect(res.body).toEqual(expect.arrayContaining([data.product[data.product.length - 1]]));
    });

    test('Offset', async () => {
      const res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          start: 1,
          sort: 'rank:asc',
        },
      });

      expect(res.body).toEqual(expect.arrayContaining(data.product.slice(1)));
    });

    test('Offset with limit', async () => {
      const res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          limit: 1,
          start: 1,
          sort: 'rank:asc',
        },
      });

      expect(res.body).toEqual(expect.arrayContaining(data.product.slice(1, 2)));
    });
  });

  describe.skip('Text query', () => {
    test('Cyrillic query', async () => {
      const res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          _q: 'Опис',
        },
      });

      expect(res.body).toEqual(expect.arrayContaining([data.product[4]]));
    });

    test('Multi word query', async () => {
      const res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          _q: 'Product description',
        },
      });

      expect(res.body).toEqual(expect.arrayContaining([data.product[0]]));
    });

    test('Multi word cyrillic query', async () => {
      const res = await rq({
        method: 'GET',
        url: '/products',
        qs: {
          _q: 'Опис на продукт',
        },
      });

      expect(res.body).toEqual(expect.arrayContaining([data.product[4]]));
    });
  });
});
