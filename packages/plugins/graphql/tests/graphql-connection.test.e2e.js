'use strict';

// Helpers.
const { createTestBuilder } = require('../../../../test/helpers/builder');
const { createStrapiInstance } = require('../../../../test/helpers/strapi');
const { createAuthRequest } = require('../../../../test/helpers/request');

const builder = createTestBuilder();
let strapi;
let rq;
let graphqlQuery;

const postModel = {
  attributes: {
    name: {
      type: 'string',
    },
    rating: {
      type: 'integer',
    },
  },
  name: 'post',
  description: '',
  collectionName: '',
};

const postFixtures = [
  {
    name: 'post 1',
    rating: 4,
  },
  {
    name: 'post 2',
    rating: 3,
  },
  {
    name: 'post 3',
    rating: 3,
  },
  {
    name: 'post 4',
    rating: 4,
  },
];

describe('Test Graphql Connection', () => {
  beforeAll(async () => {
    await builder
      .addContentType(postModel)
      .addFixtures(postModel.name, postFixtures)
      .build();

    strapi = await createStrapiInstance();
    rq = await createAuthRequest({ strapi });

    graphqlQuery = body => {
      return rq({
        url: '/graphql',
        method: 'POST',
        body,
      });
    };
  });

  afterAll(async () => {
    await strapi.destroy();
    await builder.cleanup();
  });

  describe('Test values connection', () => {
    test('List posts', async () => {
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          {
            postsConnection {
              values {
                name
                rating
              }
            }
          }
        `,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.postsConnection.values.length).toBe(postFixtures.length);
      expect(res.body.data.postsConnection.values).toEqual(expect.arrayContaining(postFixtures));
    });

    test('List posts with limit', async () => {
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          {
            postsConnection(limit: 1) {
              values {
                name
                rating
              }
            }
          }
        `,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.postsConnection.values.length).toBe(1);
    });
  });

  describe('Test groupBy', () => {
    test('Groupby simple query', async () => {
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          {
            postsConnection {
              groupBy {
                rating {
                  key
                }
              }
            }
          }
        `,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.postsConnection.groupBy.rating.length).toBe(2);
      expect(res.body.data.postsConnection.groupBy.rating).toEqual(
        expect.arrayContaining([
          {
            key: 3,
          },
          { key: 4 },
        ])
      );
    });
  });
});
