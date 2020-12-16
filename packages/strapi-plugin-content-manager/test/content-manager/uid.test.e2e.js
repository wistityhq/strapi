// Helpers.
const { registerAndLogin } = require('../../../../test/helpers/auth');
const createModelsUtils = require('../../../../test/helpers/models');
const { createAuthRequest } = require('../../../../test/helpers/request');
const Randexp = require('randexp');

let modelsUtils;
let rq;
let uid = 'application::uid-model.uid-model';
const testRegexPattern = '^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$';

describe('Content Manager single types', () => {
  beforeAll(async () => {
    const token = await registerAndLogin();
    rq = createAuthRequest(token);

    modelsUtils = createModelsUtils({ rq });

    await modelsUtils.createContentType({
      kind: 'collectionType',
      name: 'uid-model',
      attributes: {
        title: {
          type: 'string',
        },
        slug: {
          type: 'uid',
          targetField: 'title',
        },
        slugRegex: {
          type: 'uid',
          regex: testRegexPattern,
        },
        otherField: {
          type: 'integer',
        },
      },
    });
  }, 60000);

  afterAll(() => modelsUtils.deleteContentType('uid-model'), 60000);

  describe('Generate UID', () => {
    test('Throws if input is not provided', async () => {
      const res = await rq({
        url: `/content-manager/explorer/uid/generate`,
        method: 'POST',
        body: {},
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        statusCode: 400,
        error: 'Bad Request',
        message: 'ValidationError',
        data: {
          contentTypeUID: expect.arrayContaining([expect.stringMatching('required field')]),
          field: expect.arrayContaining([expect.stringMatching('required field')]),
          data: expect.arrayContaining([expect.stringMatching('required field')]),
        },
      });
    });

    test('Throws when contentType is not found', async () => {
      const res = await rq({
        url: `/content-manager/explorer/uid/generate`,
        method: 'POST',
        body: {
          contentTypeUID: 'non-existent',
          field: 'slug',
          data: {},
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: 'ValidationError',
        data: ['ContentType not found'],
      });
    });

    test('Throws when field is not a uid field', async () => {
      const res = await rq({
        url: `/content-manager/explorer/uid/generate`,
        method: 'POST',
        body: {
          contentTypeUID: uid,
          field: 'otherField',
          data: {},
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        statusCode: 400,
        error: 'Bad Request',
        message: 'ValidationError',
        data: {
          field: [expect.stringMatching('must be a valid `uid` attribute')],
        },
      });
    });

    test('Generates a unique field when not targetField', async () => {
      const res = await rq({
        url: `/content-manager/explorer/uid/generate`,
        method: 'POST',
        body: {
          contentTypeUID: uid,
          field: 'slug',
          data: {},
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toBe('uid-model');

      await rq({
        url: `/content-manager/explorer/${uid}`,
        method: 'POST',
        body: {
          slug: res.body.data,
        },
      });

      const secondRes = await rq({
        url: `/content-manager/explorer/uid/generate`,
        method: 'POST',
        body: {
          contentTypeUID: uid,
          field: 'slug',
          data: {},
        },
      });

      expect(secondRes.statusCode).toBe(200);
      expect(secondRes.body.data).toBe('uid-model-1');
    });

    test('Generates a unique field based on targetField', async () => {
      const res = await rq({
        url: `/content-manager/explorer/uid/generate`,
        method: 'POST',
        body: {
          contentTypeUID: uid,
          field: 'slug',
          data: {
            title: 'This is a super title',
          },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toBe('this-is-a-super-title');

      await rq({
        url: `/content-manager/explorer/${uid}`,
        method: 'POST',
        body: {
          slug: res.body.data,
        },
      });

      const secondRes = await rq({
        url: `/content-manager/explorer/uid/generate`,
        method: 'POST',
        body: {
          contentTypeUID: uid,
          field: 'slug',
          data: {
            title: 'This is a super title',
          },
        },
      });

      expect(secondRes.statusCode).toBe(200);
      expect(secondRes.body.data).toBe('this-is-a-super-title-1');
    });

    test('Generates a random field based on Regex', async () => {
      const res = await rq({
        url: `/content-manager/explorer/uid/generate`,
        method: 'POST',
        body: {
          contentTypeUID: uid,
          field: 'slugRegex',
          data: {},
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toMatch(new RegExp(testRegexPattern));
    });

    test('Avoids collisions with already generated uids', async () => {
      const res = await rq({
        url: `/content-manager/explorer/uid/generate`,
        method: 'POST',
        body: {
          contentTypeUID: uid,
          field: 'slug',
          data: {
            title: 'My title',
          },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toBe('my-title');

      await rq({
        url: `/content-manager/explorer/${uid}`,
        method: 'POST',
        body: {
          slug: res.body.data,
        },
      });

      const secondRes = await rq({
        url: `/content-manager/explorer/uid/generate`,
        method: 'POST',
        body: {
          contentTypeUID: uid,
          field: 'slug',
          data: {
            title: 'My title',
          },
        },
      });

      expect(secondRes.statusCode).toBe(200);
      expect(secondRes.body.data).toBe('my-title-1');

      await rq({
        url: `/content-manager/explorer/${uid}`,
        method: 'POST',
        body: {
          slug: secondRes.body.data,
        },
      });

      const thridRes = await rq({
        url: `/content-manager/explorer/uid/generate`,
        method: 'POST',
        body: {
          contentTypeUID: uid,
          field: 'slug',
          data: {
            title: 'My title 1',
          },
        },
      });

      expect(thridRes.statusCode).toBe(200);
      expect(thridRes.body.data).toBe('my-title-1-1');
    });
  });

  describe('Check UID availability', () => {
    test('Throws if input is not provided', async () => {
      const res = await rq({
        url: `/content-manager/explorer/uid/check-availability`,
        method: 'POST',
        body: {},
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        statusCode: 400,
        error: 'Bad Request',
        message: 'ValidationError',
        data: {
          contentTypeUID: expect.arrayContaining([expect.stringMatching('required field')]),
          field: expect.arrayContaining([expect.stringMatching('required field')]),
          value: expect.arrayContaining([expect.stringMatching('required field')]),
        },
      });
    });

    test('Throws on invalid uid value', async () => {
      const res = await rq({
        url: `/content-manager/explorer/uid/check-availability`,
        method: 'POST',
        body: {
          contentTypeUID: uid,
          field: 'slug',
          value: 'Invalid UID valuéééé',
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        data: {
          value: expect.arrayContaining([expect.stringMatching('must match')]),
        },
      });
    });

    test('Throws when contentType is not found', async () => {
      const res = await rq({
        url: `/content-manager/explorer/uid/check-availability`,
        method: 'POST',
        body: {
          contentTypeUID: 'non-existent',
          field: 'slug',
          value: 'some-slug',
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        statusCode: 400,
        error: 'Bad Request',
        message: 'ValidationError',
        data: ['ContentType not found'],
      });
    });

    test('Throws when field is not a uid field', async () => {
      const res = await rq({
        url: `/content-manager/explorer/uid/check-availability`,
        method: 'POST',
        body: {
          contentTypeUID: uid,
          field: 'otherField',
          value: 'some-slug',
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        statusCode: 400,
        error: 'Bad Request',
        message: 'ValidationError',
        data: {
          field: [expect.stringMatching('must be a valid `uid` attribute')],
        },
      });
    });

    test('Checks availability', async () => {
      const res = await rq({
        url: `/content-manager/explorer/uid/check-availability`,
        method: 'POST',
        body: {
          contentTypeUID: uid,
          field: 'slug',
          value: 'some-available-slug',
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        isAvailable: true,
        suggestion: null,
      });
    });

    test('Gives a suggestion when not available', async () => {
      // create data
      const slugRegex = new Randexp(testRegexPattern).gen();
      await rq({
        url: `/content-manager/explorer/${uid}`,
        method: 'POST',
        body: {
          slug: 'custom-slug',
          slugRegex: slugRegex,
        },
      });

      const res = await rq({
        url: `/content-manager/explorer/uid/check-availability`,
        method: 'POST',
        body: {
          contentTypeUID: uid,
          field: 'slug',
          value: 'custom-slug',
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        isAvailable: false,
        suggestion: 'custom-slug-1',
      });

      //ignore suggestion if Regexp is defined
      const secondRes = await rq({
        url: `/content-manager/explorer/uid/check-availability`,
        method: 'POST',
        body: {
          contentTypeUID: uid,
          field: 'slugRegex',
          value: slugRegex,
        },
      });

      expect(secondRes.statusCode).toBe(200);
      expect(secondRes.body).toEqual({
        isAvailable: false,
        suggestion: null,
      });
    });
  });
});
