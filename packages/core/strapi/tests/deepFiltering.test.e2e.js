'use strict';

// Test an API with all the possible filed types and simple filterings (no deep filtering, no relations)

const { createStrapiInstance } = require('../../../../test/helpers/strapi');
const { createTestBuilder } = require('../../../../test/helpers/builder');
const { createAuthRequest } = require('../../../../test/helpers/request');

const builder = createTestBuilder();
const data = {
  card: [],
  collector: [],
};
let rq;
let strapi;

const card = {
  name: 'card',
  kind: 'collectionType',
  attributes: {
    name: {
      type: 'string',
    },
  },
};

const collector = {
  name: 'collector',
  kind: 'collectionType',
  attributes: {
    name: {
      type: 'string',
    },
    age: {
      type: 'integer',
    },
    cards: {
      type: 'relation',
      relation: 'oneToMany',
      target: 'application::card.card',
    },
    collector_friends: {
      type: 'relation',
      relation: 'oneToMany',
      target: '__self__',
    },
  },
};

const fixtures = {
  card: [
    {
      name: 'Hugo LLORIS',
    },
    {
      name: 'Samuel UMTITI',
    },
    {
      name: 'Lucas HERNANDEZ',
    },
  ],
  collector: ({ card }) => [
    {
      name: 'Bernard',
      age: 25,
      cards: [card[0].id, card[1].id],
    },
    self => ({
      name: 'Isabelle',
      age: 55,
      cards: [card[0].id],
      collector_friends: [self[0].id],
    }),
    self => ({
      name: 'Kenza',
      age: 25,
      cards: [],
      collector_friends: [self[0].id],
    }),
  ],
};

describe('Deep Filtering API', () => {
  beforeAll(async () => {
    await builder
      .addContentTypes([card, collector])
      .addFixtures(card.name, fixtures.card)
      .addFixtures(collector.name, fixtures.collector)
      .build();

    strapi = await createStrapiInstance();
    rq = await createAuthRequest({ strapi });

    Object.assign(data, builder.sanitizedFixtures(strapi));
  });

  afterAll(async () => {
    await strapi.destroy();
    await builder.cleanup();
  });

  describe('Without search', () => {
    describe('Filter on a manyWay relation', () => {
      test('Should return 2 results', async () => {
        const res = await rq({
          method: 'GET',
          url: '/collectors',
          qs: {
            filters: { cards: { name: data.card[0].name } },
          },
        });

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
        expect(res.body[0]).toMatchObject(data.collector[0]);
        expect(res.body[1]).toMatchObject(data.collector[1]);
      });

      test('Should return 1 result', async () => {
        const res = await rq({
          method: 'GET',
          url: '/collectors',
          qs: {
            filters: { cards: { name: data.card[1].name } },
          },
        });

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0]).toMatchObject(data.collector[0]);
      });
    });

    describe('Filter on a self manyWay relation', () => {
      test('Should return 2 results', async () => {
        const res = await rq({
          method: 'GET',
          url: '/collectors',
          qs: {
            filters: { collector_friends: { name: data.collector[0].name } },
          },
        });

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
        expect(res.body).toEqual(expect.arrayContaining(data.collector.slice(1, 3)));
      });
    });
  });

  describe.skip('With search', () => {
    describe('Filter on a manyWay relation', () => {
      test('cards.name + empty search', async () => {
        const res = await rq({
          method: 'GET',
          url: '/collectors',
          qs: {
            filters: {
              cards: {
                name: data.card[0].name,
              },
            },
            _q: '',
          },
        });

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
        expect(res.body).toEqual(expect.arrayContaining(data.collector.slice(0, 2)));
      });

      test('cards.name + _q=25', async () => {
        const res = await rq({
          method: 'GET',
          url: '/collectors',
          qs: {
            'cards.name': data.card[0].name,
            _q: 25,
          },
        });

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0]).toMatchObject(data.collector[0]);
      });
    });

    describe('Filter on a self manyWay relation', () => {
      test('collector_friends.name + empty search', async () => {
        const res = await rq({
          method: 'GET',
          url: '/collectors',
          qs: {
            'collector_friends.name': data.collector[0].name,
            _q: '',
          },
        });

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
        expect(res.body).toEqual(expect.arrayContaining(data.collector.slice(1, 3)));
      });
      test('collector_friends.name + search isa', async () => {
        const res = await rq({
          method: 'GET',
          url: '/collectors',
          qs: {
            'collector_friends.name': data.collector[0].name,
            _q: 'isa',
          },
        });

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0]).toMatchObject(data.collector[1]);
      });
    });
  });
});
