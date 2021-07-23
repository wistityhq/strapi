'use strict';

const _ = require('lodash');

const { createTestBuilder } = require('../../../../test/helpers/builder');
const { createStrapiInstance } = require('../../../../test/helpers/strapi');
const { createAuthRequest } = require('../../../../test/helpers/request');
const modelsUtils = require('../../../../test/helpers/models');

let builder;
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
    },
    code: {
      type: 'string',
      unique: true,
    },
  },
  connection: 'default',
  name: 'dog',
  description: '',
  collectionName: '',
};

const dogs = [
  {
    name: 'Nelson',
    code: '1',
  },
  {
    name: 'Atos',
    code: '2',
  },
];

const restart = async () => {
  await strapi.destroy();
  strapi = await createStrapiInstance();
  rq = await createAuthRequest({ strapi });
};

const sortDogs = dogs => _.sortBy(dogs, 'name');

describe('Migration - draft and publish', () => {
  describe.each([
    ['without table modifications', {}, {}],
    ['with table modifications', { town: { type: 'string' } }, { color: { type: 'string' } }],
  ])('%p', (testName, tableModification1, tableModification2) => {
    beforeAll(async () => {
      builder = createTestBuilder();

      await builder
        .addContentType(dogModel)
        .addFixtures(dogModel.name, dogs)
        .build();

      strapi = await createStrapiInstance();
      rq = await createAuthRequest({ strapi });

      data.dogs = sortDogs(builder.sanitizedFixturesFor(dogModel.name, strapi));
    });

    afterAll(async () => {
      await strapi.destroy();
      await builder.cleanup();
    });

    describe('Enabling D&P on a content-type', () => {
      test('No published_at before enabling the feature', async () => {
        let { body } = await rq({
          url: '/content-manager/collection-types/application::dog.dog',
          method: 'GET',
        });

        expect(body.results.length).toBe(2);

        const sortedBody = sortDogs(body.results);

        sortedBody.forEach((dog, index) => {
          expect(dog).toMatchObject(data.dogs[index]);
          expect(dog.published_at).toBeUndefined();
        });
      });

      test('Published_at is equal to created_at after enabling the feature', async () => {
        const schema = await modelsUtils.getContentTypeSchema(dogModel.name, { strapi });

        await modelsUtils.modifyContentType(
          {
            ...schema,
            attributes: _.merge(schema.attributes, tableModification1),
            draftAndPublish: true,
          },
          { strapi }
        );

        await restart();

        let { body } = await rq({
          method: 'GET',
          url: '/content-manager/collection-types/application::dog.dog',
        });

        expect(body.results.length).toBe(2);

        const sortedBody = sortDogs(body.results);

        sortedBody.forEach((dog, index) => {
          expect(dog).toMatchObject(data.dogs[index]);
          expect(dog.published_at).toBe(dog.createdAt || dog.created_at);
          expect(!isNaN(new Date(dog.published_at).valueOf())).toBe(true);
        });

        data.dogs = sortedBody;
      });
    });

    describe('Disabling D&P on a content-type', () => {
      test('No published_at after disabling the feature + draft removed', async () => {
        const res = await rq({
          method: 'POST',
          url: `/content-manager/collection-types/application::dog.dog/${data.dogs[1].id}/actions/unpublish`,
        });

        data.dogs[1] = res.body;

        const schema = await modelsUtils.getContentTypeSchema(dogModel.name, { strapi });

        await modelsUtils.modifyContentType(
          {
            ...schema,
            draftAndPublish: false,
            attributes: _.merge(schema.attributes, tableModification2),
          },
          { strapi }
        );

        await restart();

        // drafts should have been deleted with the migration, so we remove them
        data.dogs = data.dogs.filter(dog => !_.isNil(dog.published_at));

        let { body } = await rq({
          url: '/content-manager/collection-types/application::dog.dog',
          method: 'GET',
        });

        expect(body.results.length).toBe(1);
        expect(body.results[0]).toMatchObject(_.pick(data.dogs[0], ['name']));
        expect(body.results[0].published_at).toBeUndefined();
      });

      test('Unique constraint is kept after disabling the feature', async () => {
        const dogToCreate = { code: 'sameCode' };

        let res = await rq({
          method: 'POST',
          url: `/content-manager/collection-types/application::dog.dog/`,
          body: dogToCreate,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject(dogToCreate);

        data.dogs.push(res.body);

        res = await rq({
          method: 'POST',
          url: `/content-manager/collection-types/application::dog.dog/`,
          body: dogToCreate,
        });

        expect(res.statusCode).toBe(400);
      });
    });
  });
});
