'use strict';

const fs = require('fs');
const path = require('path');

const { registerAndLogin } = require('../../../../test/helpers/auth');
const createModelsUtils = require('../../../../test/helpers/models');
const { createAuthRequest } = require('../../../../test/helpers/request');

let modelsUtils;
let rq;
let authRq;

const uploadImg = () => {
  return authRq.post('/upload', {
    formData: {
      files: fs.createReadStream(path.join(__dirname, 'rec.jpg')),
    },
  });
};

describe.each([
  [
    'CONTENT MANAGER',
    '/content-manager/collection-types/application::withdynamiczonemedia.withdynamiczonemedia',
  ],
  ['GENERATED API', '/withdynamiczonemedias'],
])('[%s] => Not required dynamiczone', (_, path) => {
  beforeAll(async () => {
    const token = await registerAndLogin();
    authRq = createAuthRequest(token);

    modelsUtils = createModelsUtils({ rq: authRq });

    await modelsUtils.createComponent({
      name: 'single-media',
      attributes: {
        media: {
          type: 'media',
        },
      },
    });

    await modelsUtils.createComponent({
      name: 'multiple-media',
      attributes: {
        media: {
          type: 'media',
          multiple: true,
        },
      },
    });

    await modelsUtils.createComponent({
      name: 'with-nested',
      attributes: {
        singleMedia: {
          type: 'component',
          component: 'default.single-media',
        },
        multipleMedia: {
          type: 'component',
          component: 'default.multiple-media',
        },
      },
    });

    await modelsUtils.createContentTypeWithType('withdynamiczonemedia', 'dynamiczone', {
      components: ['default.single-media', 'default.multiple-media', 'default.with-nested'],
    });

    rq = authRq.defaults({
      baseUrl: `http://localhost:1337${path}`,
    });
  }, 60000);

  afterAll(async () => {
    await modelsUtils.deleteComponent('default.with-nested');
    await modelsUtils.deleteComponent('default.single-media');
    await modelsUtils.deleteComponent('default.multiple-media');
    await modelsUtils.deleteContentType('withdynamiczonemedia');
  }, 60000);

  describe('Contains components with medias', () => {
    test('The medias are correctly related to the components on creation', async () => {
      const imgRes = await uploadImg();

      expect(imgRes.statusCode).toBe(200);
      const mediaId = imgRes.body[0].id;

      const res = await rq.post('/', {
        body: {
          field: [
            {
              __component: 'default.single-media',
              media: mediaId,
            },
            {
              __component: 'default.multiple-media',
              media: [mediaId, mediaId],
            },
          ],
        },
      });

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.field)).toBe(true);
      expect(res.body).toMatchObject({
        field: [
          {
            id: expect.anything(),
            __component: 'default.single-media',
            media: {
              id: mediaId,
              url: expect.any(String),
            },
          },
          {
            id: expect.anything(),
            __component: 'default.multiple-media',
            media: expect.arrayContaining([
              expect.objectContaining({
                id: mediaId,
                url: expect.any(String),
              }),
            ]),
          },
        ],
      });
    });

    test('The medias are correctly related to the components on edition', async () => {
      const imgRes = await uploadImg();

      expect(imgRes.statusCode).toBe(200);
      const mediaId = imgRes.body[0].id;

      const res = await rq.post('/', {
        body: {
          field: [
            {
              __component: 'default.single-media',
              media: mediaId,
            },
            {
              __component: 'default.multiple-media',
              media: [mediaId, mediaId],
            },
          ],
        },
      });

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.field)).toBe(true);

      const newImgRes = await uploadImg();

      expect(newImgRes.statusCode).toBe(200);
      const newMediaId = newImgRes.body[0].id;

      const updateRes = await rq.put(`/${res.body.id}`, {
        body: {
          field: [
            {
              __component: 'default.single-media',
              media: newMediaId,
            },
            {
              __component: 'default.multiple-media',
              media: [newMediaId, newMediaId],
            },
          ],
        },
      });

      expect(updateRes.body).toMatchObject({
        field: [
          {
            id: expect.anything(),
            __component: 'default.single-media',
            media: {
              id: newMediaId,
              url: expect.any(String),
            },
          },
          {
            id: expect.anything(),
            __component: 'default.multiple-media',
            media: expect.arrayContaining([
              expect.objectContaining({
                id: newMediaId,
                url: expect.any(String),
              }),
            ]),
          },
        ],
      });
    });

    test('The media are populated on the components', async () => {
      const imgRes = await uploadImg();

      expect(imgRes.statusCode).toBe(200);
      const mediaId = imgRes.body[0].id;

      const res = await rq.post('/', {
        body: {
          field: [
            {
              __component: 'default.single-media',
              media: mediaId,
            },
            {
              __component: 'default.multiple-media',
              media: [mediaId, mediaId],
            },
          ],
        },
      });

      expect(res.statusCode).toBe(200);

      const getRes = await rq.get(`/${res.body.id}`);
      expect(getRes.body).toMatchObject({
        field: [
          {
            id: expect.anything(),
            __component: 'default.single-media',
            media: {
              id: mediaId,
              url: expect.any(String),
            },
          },
          {
            id: expect.anything(),
            __component: 'default.multiple-media',
            media: expect.arrayContaining([
              expect.objectContaining({
                id: mediaId,
                url: expect.any(String),
              }),
            ]),
          },
        ],
      });
    });
  });

  describe('Contains components with nested components having medias', () => {
    test('The medias are correctly related to the nested components on creation', async () => {
      const imgRes = await uploadImg();

      expect(imgRes.statusCode).toBe(200);
      const mediaId = imgRes.body[0].id;

      const res = await rq.post('/', {
        body: {
          field: [
            {
              __component: 'default.with-nested',
              singleMedia: {
                media: mediaId,
              },
              multipleMedia: {
                media: [mediaId, mediaId],
              },
            },
          ],
        },
      });

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.field)).toBe(true);
      expect(res.body).toMatchObject({
        field: [
          {
            id: expect.anything(),
            __component: 'default.with-nested',
            singleMedia: {
              media: {
                id: mediaId,
                url: expect.any(String),
              },
            },
            multipleMedia: {
              media: expect.arrayContaining([
                expect.objectContaining({
                  id: mediaId,
                  url: expect.any(String),
                }),
              ]),
            },
          },
        ],
      });
    });
  });
});
