'use strict';

const { registerAndLogin } = require('../../../test/helpers/auth');
const { createAuthRequest } = require('../../../test/helpers/request');
const createModelsUtils = require('../../../test/helpers/models');

let rq;
let modelsUtils;
let data = {
  dogs: [],
};

const dogModel = {
  draftAndPublish: false,
  attributes: {
    name: {
      type: 'string',
      unique: false,
    },
  },
  connection: 'default',
  name: 'dog',
  description: '',
  collectionName: '',
};

const dogs = [
  {
    name: 'Atos',
  },
  {
    name: 'Atos',
  },
];

describe('Migration - unique attribute', () => {
  beforeAll(async () => {
    const token = await registerAndLogin();
    rq = createAuthRequest(token);
    modelsUtils = createModelsUtils({ rq });
    await modelsUtils.createContentTypes([dogModel]);
    for (const dog of dogs) {
      const res = await rq({
        method: 'POST',
        url: '/content-manager/collection-types/application::dog.dog',
        body: dog,
      });
      data.dogs.push(res.body);
    }
  }, 60000);

  afterAll(async () => {
    await rq({
      method: 'POST',
      url: '/content-manager/collection-types/application::dog.dog/actions/bulkDelete',
      body: { ids: data.dogs.map(({ id }) => id) },
    });
    await modelsUtils.deleteContentTypes(['dog']);
  }, 60000);

  describe('Unique: false -> true', () => {
    test('Can have duplicates before migration', async () => {
      let { body } = await rq({
        url: '/content-manager/collection-types/application::dog.dog',
        method: 'GET',
      });
      expect(body.results.length).toBe(2);
      expect(body.results[0].name).toEqual(body.results[1].name);
    });

    test('Cannot create a duplicated entry after migration', async () => {
      // remove duplicated values otherwise the migration would fail
      const { body } = await rq({
        url: `/content-manager/collection-types/application::dog.dog/${data.dogs[0].id}`,
        method: 'PUT',
        body: { name: 'Nelson' },
      });
      data.dogs[0] = body;

      // migration
      const schema = await modelsUtils.getContentTypeSchema('dog');
      schema.attributes.name.unique = true;
      await modelsUtils.modifyContentType(schema);

      // Try to create a duplicated entry
      const res = await rq({
        method: 'POST',
        url: '/content-manager/collection-types/application::dog.dog',
        body: { name: data.dogs[0].name },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Unique: true -> false', () => {
    test('Can create a duplicated entry after migration', async () => {
      // migration
      const schema = await modelsUtils.getContentTypeSchema('dog');
      schema.attributes.name.unique = false;
      await modelsUtils.modifyContentType(schema);

      // Try to create a duplicated entry
      const res = await rq({
        url: `/content-manager/collection-types/application::dog.dog`,
        method: 'POST',
        body: { name: data.dogs[0].name },
      });

      expect(res.body).toMatchObject({ name: data.dogs[0].name });
      data.dogs.push(res.body);
    });
  });
});
