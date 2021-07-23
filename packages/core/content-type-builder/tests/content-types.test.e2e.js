/**
 * Integration test for the content-type-builder content types management apis
 */
'use strict';

const { createStrapiInstance } = require('../../../../test/helpers/strapi');
const { createAuthRequest } = require('../../../../test/helpers/request');
const modelsUtils = require('../../../../test/helpers/models');

let strapi;
let rq;

const restart = async () => {
  await strapi.destroy();
  strapi = await createStrapiInstance();
  rq = await createAuthRequest({ strapi });
};

describe('Content Type Builder - Content types', () => {
  beforeAll(async () => {
    strapi = await createStrapiInstance();
    rq = await createAuthRequest({ strapi });
  });

  afterEach(async () => {
    await restart();
  });

  afterAll(async () => {
    const modelsUIDs = [
      'application::test-collection-type.test-collection-type',
      'application::test-collection.test-collection',
      'application::test-single-type.test-single-type',
      'application::ct-with-dp.ct-with-dp',
    ];

    await modelsUtils.cleanupModels(modelsUIDs, { strapi });
    await modelsUtils.deleteContentTypes(modelsUIDs, { strapi });

    await strapi.destroy();
  });

  describe('Collection Types', () => {
    const testCollectionTypeUID = 'application::test-collection-type.test-collection-type';
    const ctWithDpUID = 'application::ct-with-dp.ct-with-dp';

    test('Successful creation of a collection type', async () => {
      const res = await rq({
        method: 'POST',
        url: '/content-type-builder/content-types',
        body: {
          contentType: {
            name: 'Test Collection Type',
            pluginOptions: {
              i18n: {
                localized: true,
              },
            },
            attributes: {
              title: {
                type: 'string',
                pluginOptions: {
                  i18n: {
                    localized: true,
                  },
                },
              },
            },
          },
        },
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({
        data: {
          uid: testCollectionTypeUID,
        },
      });
    });

    test('Get collection type returns full schema and information', async () => {
      const res = await rq({
        method: 'GET',
        url: `/content-type-builder/content-types/${testCollectionTypeUID}`,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchSnapshot();
    });

    test('Successfull creation of a collection type with draftAndPublish enabled', async () => {
      const res = await rq({
        method: 'POST',
        url: '/content-type-builder/content-types',
        body: {
          contentType: {
            name: 'CT with DP',
            draftAndPublish: true,
            attributes: {
              title: {
                type: 'string',
              },
            },
          },
        },
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({
        data: {
          uid: ctWithDpUID,
        },
      });
    });

    test('Get collection type returns full schema and informations with draftAndPublish', async () => {
      const res = await rq({
        method: 'GET',
        url: `/content-type-builder/content-types/${ctWithDpUID}`,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchSnapshot();
    });
  });

  describe('Single Types', () => {
    const singleTypeUID = 'application::test-single-type.test-single-type';

    test('Successful creation of a single type', async () => {
      const res = await rq({
        method: 'POST',
        url: '/content-type-builder/content-types',
        body: {
          contentType: {
            kind: 'singleType',
            name: 'Test Single Type',
            pluginOptions: {
              i18n: {
                localized: true,
              },
            },
            attributes: {
              title: {
                type: 'string',
                pluginOptions: {
                  i18n: {
                    localized: true,
                  },
                },
              },
            },
          },
        },
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({
        data: {
          uid: singleTypeUID,
        },
      });
    });

    test('Get single type returns full schema and information', async () => {
      const res = await rq({
        method: 'GET',
        url: `/content-type-builder/content-types/${singleTypeUID}`,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchSnapshot();
    });

    test('Fails on invalid relations', async () => {
      const res = await rq({
        method: 'POST',
        url: '/content-type-builder/content-types',
        body: {
          contentType: {
            kind: 'singleType',
            name: 'test-st',
            attributes: {
              relation: {
                type: 'relation',
                relation: 'oneTo',
                target: 'plugins::users-permissions.user',
                targetAttribute: 'test',
              },
            },
          },
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        error: {
          ['contentType.attributes.relation.relation']: expect.arrayContaining([
            expect.stringMatching('must be one of the following values: oneToOne, oneToMany'),
          ]),
        },
      });
    });

    test('Cannot switch collectionType to singleType when multiple entries in DB', async () => {
      const createRes = await rq({
        method: 'POST',
        url: '/content-type-builder/content-types',
        body: {
          contentType: {
            kind: 'collectionType',
            name: 'test-collection',
            attributes: {
              title: {
                type: 'string',
              },
            },
          },
        },
      });

      expect(createRes.statusCode).toBe(201);

      await restart();

      const { uid } = createRes.body.data;

      // create data
      for (let i = 0; i < 2; i++) {
        const res = await rq({
          method: 'POST',
          url: `/test-collections`,
          body: {
            title: 'Test',
          },
        });

        expect(res.statusCode).toBe(200);
      }

      const updateRes = await rq({
        method: 'PUT',
        url: `/content-type-builder/content-types/${uid}`,
        body: {
          contentType: {
            kind: 'singleType',
            name: 'test-collection',
            attributes: {
              title: {
                type: 'string',
              },
            },
          },
        },
      });

      expect(updateRes.statusCode).toBe(400);
      expect(updateRes.body.error).toMatch('multiple entries in DB');
    });
  });

  describe('Private relation field', () => {
    const singleTypeUID = 'application::test-single-type.test-single-type';

    test('should add a relation field', async () => {
      const res = await rq({
        method: 'PUT',
        url: `/content-type-builder/content-types/${singleTypeUID}`,
        body: {
          contentType: {
            kind: 'singleType',
            name: 'test-collection',
            attributes: {
              relation: {
                private: true,
                type: 'relation',
                relation: 'oneToOne',
                target: 'plugins::users-permissions.user',
              },
            },
          },
        },
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({
        data: {
          uid: singleTypeUID,
        },
      });
    });

    test('should contain a private relation field', async () => {
      const res = await rq({
        method: 'GET',
        url: `/content-type-builder/content-types/${singleTypeUID}`,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.schema.attributes.relation).toBeDefined();
      expect(res.body.data.schema.attributes.relation.private).toBeTruthy();
    });
  });
});
