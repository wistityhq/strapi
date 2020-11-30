'use strict';

// Test an API with all the possible filed types and simple filterings (no deep filtering, no relations)
const { registerAndLogin } = require('../../../test/helpers/auth');
const createModelsUtils = require('../../../test/helpers/models');
const { createAuthRequest } = require('../../../test/helpers/request');

let rq;
let modelsUtils;
let data = {
  beds: [],
};

const bedModel = {
  name: 'bed',
  kind: 'collectionType',
  attributes: {
    name: {
      type: 'string',
    },
    weight: {
      type: 'decimal',
    },
    shortDescription: {
      type: 'text',
    },
    description: {
      type: 'richtext',
    },
    sku: {
      type: 'uid',
    },
    savEmail: {
      type: 'email',
    },
    type: {
      enum: ['spring', 'foam', 'feather'],
      type: 'enumeration',
    },
    serialNumber: {
      type: 'biginteger',
    },
    peopleNumber: {
      type: 'integer',
    },
    fabricThickness: {
      type: 'float',
    },
  },
};

const bedFixtures = [
  {
    // will have id=1
    name: 'Sleepy Bed',
    weight: 12.4,
    shortDescription: 'Is a good bed to sleep in.',
    description: '**Is a very good bed to sleep in.** We promise.',
    sku: 'sleepybed_0152',
    savEmail: 'sav@bed.fr',
    type: 'foam',
    serialNumber: 9999999999999999,
    peopleNumber: 6,
    fabricThickness: 1.14157,
  },
  {
    // will have id=2
    name: 'Tired Bed',
    weight: 11.1,
    shortDescription: 'You will never wake up again.',
    description: '**You will never wake up again.** Never.',
    sku: 'tiredbed_0001',
    savEmail: 'sav@sleep.fr',
    type: 'feather',
    serialNumber: 1111111111111111,
    peopleNumber: 1,
    fabricThickness: 1.0001,
  },
  {
    // will have id=3
    // other beds don't contain any 3 in order to find only Zombie Bed when searching 3
    name: 'Zombie Bed',
    weight: null,
    shortDescription: null,
    description: null,
    sku: null,
    savEmail: null,
    type: null,
    serialNumber: null,
    peopleNumber: null,
    fabricThickness: null,
  },
  {
    // will have id=4
    name: 'a*b_c%d\\e+f',
    weight: null,
    shortDescription: null,
    description: null,
    sku: null,
    savEmail: null,
    type: null,
    serialNumber: null,
    peopleNumber: null,
    fabricThickness: null,
  },
  {
    // will have id=5
    name: 'Tired Bed',
    weight: null,
    shortDescription: null,
    description: null,
    sku: null,
    savEmail: null,
    type: null,
    serialNumber: null,
    peopleNumber: 7,
    fabricThickness: null,
  },
];

async function createFixtures() {
  for (let bedFixture of bedFixtures) {
    const res = await rq({
      method: 'POST',
      url: '/content-manager/collection-types/application::bed.bed',
      body: bedFixture,
    });

    data.beds.push(res.body);
  }
}

async function deleteFixtures() {
  await rq({
    method: 'POST',
    url: '/content-manager/collection-types/application::bed.bed/actions/bulkDelete',
    body: {
      ids: data.beds.map(({ id }) => id),
    },
  });
}

describe('Search query', () => {
  beforeAll(async () => {
    const token = await registerAndLogin();
    rq = createAuthRequest(token);

    modelsUtils = createModelsUtils({ rq });
    await modelsUtils.createContentTypes([bedModel]);
    await createFixtures();
  }, 60000);

  afterAll(async () => {
    await deleteFixtures();
    await modelsUtils.deleteContentTypes(['bed']);
  }, 60000);

  describe('Without filters', () => {
    test('search for "id"', async () => {
      const res = await rq({
        method: 'GET',
        url: '/content-manager/collection-types/application::bed.bed',
        qs: {
          _q: data.beds[2].id,
        },
      });

      expect(Array.isArray(res.body.results)).toBe(true);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0]).toMatchObject(data.beds[2]);
    });

    test.each(Object.keys(bedFixtures[0]))('search that target column %p', async columnName => {
      const res = await rq({
        method: 'GET',
        url: '/content-manager/collection-types/application::bed.bed',
        qs: {
          _q: bedFixtures[0][columnName],
        },
      });

      expect(Array.isArray(res.body.results)).toBe(true);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0]).toMatchObject(data.beds[0]);
    });

    test('search with an empty query', async () => {
      const res = await rq({
        method: 'GET',
        url: '/content-manager/collection-types/application::bed.bed',
        qs: {
          _q: '',
        },
      });

      expect(Array.isArray(res.body.results)).toBe(true);
      expect(res.body.results.length).toBe(5);
      expect(res.body.results).toEqual(expect.arrayContaining(data.beds));
    });

    test('search with special characters', async () => {
      const res = await rq({
        method: 'GET',
        url: '/content-manager/collection-types/application::bed.bed',
        qs: {
          _q: data.beds[3].name,
        },
      });

      expect(Array.isArray(res.body.results)).toBe(true);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0]).toMatchObject(data.beds[3]);
    });
  });

  describe('With filters', () => {
    test('search with an empty query & peopleNumber > 0', async () => {
      const res = await rq({
        method: 'GET',
        url: '/content-manager/collection-types/application::bed.bed',
        qs: {
          _q: '',
          peopleNumber_gt: 0,
        },
      });

      expect(Array.isArray(res.body.results)).toBe(true);
      expect(res.body.results.length).toBe(3);
      expect(res.body.results).toMatchObject([data.beds[0], data.beds[1], data.beds[4]]);
    });
    test('search with an empty query & peopleNumber > 1', async () => {
      const res = await rq({
        method: 'GET',
        url: '/content-manager/collection-types/application::bed.bed',
        qs: {
          _q: '',
          peopleNumber_gt: 1,
        },
      });

      expect(Array.isArray(res.body.results)).toBe(true);
      expect(res.body.results.length).toBe(2);
      expect(res.body.results).toMatchObject([data.beds[0], data.beds[4]]);
    });
    test('search with an empty query & peopleNumber in [1, 6]', async () => {
      const res = await rq({
        method: 'GET',
        url:
          '/content-manager/collection-types/application::bed.bed?peopleNumber=1&peopleNumber=6&_q=',
      });

      expect(Array.isArray(res.body.results)).toBe(true);
      expect(res.body.results.length).toBe(2);
      expect(res.body.results).toMatchObject(data.beds.slice(0, 2));
    });
    test('search for "Sleepy Bed" & peopleNumber < 7', async () => {
      const res = await rq({
        method: 'GET',
        url: '/content-manager/collection-types/application::bed.bed',
        qs: {
          _q: 'Sleepy Bed',
          peopleNumber_lt: 7,
        },
      });

      expect(Array.isArray(res.body.results)).toBe(true);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results).toMatchObject([data.beds[0]]);
    });
  });
});
