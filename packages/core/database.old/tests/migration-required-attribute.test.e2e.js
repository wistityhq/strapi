'use strict';

const { createTestBuilder } = require('../../../../test/helpers/builder');
const { createStrapiInstance } = require('../../../../test/helpers/strapi');
const { createAuthRequest } = require('../../../../test/helpers/request');
const modelsUtils = require('../../../../test/helpers/models');

const builder = createTestBuilder();
let strapi;
let rq;
let data = {
  dogs: [],
};

const dogModel = {
  draftAndPublish: false,
  attributes: {
    name: {
      type: 'string',
      required: false,
    },
  },
  connection: 'default',
  name: 'dog',
  description: '',
  collectionName: '',
};

const dogs = [
  {
    name: null,
  },
  {
    name: 'Atos',
  },
];

const restart = async () => {
  await strapi.destroy();
  strapi = await createStrapiInstance();
  rq = await createAuthRequest({ strapi });
};

describe('Migration - required attribute', () => {
  beforeAll(async () => {
    await builder
      .addContentType(dogModel)
      .addFixtures(dogModel.name, dogs)
      .build();

    strapi = await createStrapiInstance();
    rq = await createAuthRequest({ strapi });

    data.dogs = builder.sanitizedFixturesFor(dogModel.name, strapi);
  });

  afterAll(async () => {
    await strapi.destroy();
    await builder.cleanup();
  });

  describe('Required: false -> true', () => {
    test('Can be null before migration', async () => {
      let { body } = await rq({
        method: 'GET',
        url: '/content-manager/collection-types/application::dog.dog',
      });
      expect(body.results.length).toBe(2);
      const dogWithNameNull = body.results.find(dog => dog.name === null);
      expect(dogWithNameNull).toBeTruthy();
    });

    test('Cannot create an entry with null after migration', async () => {
      // remove null values otherwise the migration would fail

      const { body } = await rq({
        method: 'PUT',
        url: `/content-manager/collection-types/application::dog.dog/${data.dogs[0].id}`,
        body: { name: 'Nelson' },
      });
      data.dogs[0] = body;

      // migration
      const schema = await modelsUtils.getContentTypeSchema(dogModel.name, { strapi });
      schema.attributes.name.required = true;

      await modelsUtils.modifyContentType(schema, { strapi });
      await restart();

      // Try to create an entry with null
      const res = await rq({
        method: 'POST',
        url: '/content-manager/collection-types/application::dog.dog',
        body: { name: null },
      });
      expect(res.body.message).toBe('ValidationError');
    });
  });

  describe('Required: true -> false', () => {
    test('Can create an entry with null after migration', async () => {
      // migration
      const schema = await modelsUtils.getContentTypeSchema(dogModel.name, { strapi });
      schema.attributes.name.required = false;

      await modelsUtils.modifyContentType(schema, { strapi });
      await restart();

      // Try to create an entry with null
      const res = await rq({
        url: `/content-manager/collection-types/application::dog.dog`,
        method: 'POST',
        body: { name: null },
      });

      expect(res.body).toMatchObject({ name: null });
      data.dogs.push(res.body);
    });
  });
});
