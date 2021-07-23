'use strict';

const { createTestBuilder } = require('../../../../../test/helpers/builder');
const { createStrapiInstance } = require('../../../../../test/helpers/strapi');
const { createAuthRequest } = require('../../../../../test/helpers/request');

let strapi;
let rq;

const component = {
  name: 'somecomponent',
  attributes: {
    name: {
      type: 'string',
    },
  },
};

const ct = {
  name: 'withcomponent',
  attributes: {
    field: {
      type: 'component',
      component: 'default.somecomponent',
      repeatable: false,
      required: false,
    },
  },
};

describe.each([
  ['CONTENT MANAGER', '/content-manager/collection-types/application::withcomponent.withcomponent'],
  ['GENERATED API', '/withcomponents'],
])('[%s] => Non repeatable and Not required component', (_, path) => {
  const builder = createTestBuilder();
  const hasPagination = path.includes('/content-manager');

  beforeAll(async () => {
    await builder
      .addComponent(component)
      .addContentType(ct)
      .build();

    strapi = await createStrapiInstance();
    rq = await createAuthRequest({ strapi });
    rq.setURLPrefix(path);
  });

  afterAll(async () => {
    await strapi.destroy();
    await builder.cleanup();
  });

  describe('POST new entry', () => {
    test('Creating entry with JSON works', async () => {
      const res = await rq.post('/', {
        body: {
          field: {
            name: 'someString',
          },
        },
        qs: {
          populate: ['field'],
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.field).toEqual(
        expect.objectContaining({
          id: expect.anything(),
          name: 'someString',
        })
      );
    });

    test('Creating second entry ', async () => {
      const res = await rq.post('/', {
        body: {
          field: {
            name: 'someValue',
          },
        },
        qs: {
          populate: ['field'],
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.field).toEqual(
        expect.objectContaining({
          id: expect.anything(),
          name: 'someValue',
        })
      );
    });

    test.each([[], 'someString', 128219, false])(
      'Throws if the field is not an object %p',
      async value => {
        const res = await rq.post('/', {
          body: {
            field: value,
          },
        });

        expect(res.statusCode).toBe(400);
      }
    );

    test('Can send a null value', async () => {
      const res = await rq.post('/', {
        body: {
          field: null,
        },
        qs: {
          populate: ['field'],
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.field).toBe(null);
    });

    test('Can send input without the component field', async () => {
      const res = await rq.post('/', {
        body: {},
        qs: {
          populate: ['field'],
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.field).toBe(null);
    });
  });

  describe('GET entries', () => {
    test('Should return entries with their nested components', async () => {
      const res = await rq.get('/', {
        qs: {
          populate: ['field'],
        },
      });

      expect(res.statusCode).toBe(200);

      if (hasPagination) {
        expect(res.body.pagination).toBeDefined();
        expect(Array.isArray(res.body.results)).toBe(true);
        res.body.results.forEach(entry => {
          if (entry.field === null) return;

          expect(entry.field).toMatchObject({
            name: expect.any(String),
          });
        });
        return;
      }

      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach(entry => {
        if (entry.field === null) return;

        expect(entry.field).toMatchObject({
          name: expect.any(String),
        });
      });
    });
  });

  describe('PUT entry', () => {
    test.each([[], 'someString', 128219, false])(
      'Throws when sending invalid updated field %p',
      async value => {
        const res = await rq.post('/', {
          body: {
            field: {
              name: 'someString',
            },
          },
          qs: {
            populate: ['field'],
          },
        });

        const updateRes = await rq.put(`/${res.body.id}`, {
          body: {
            field: value,
          },
          qs: {
            populate: ['field'],
          },
        });

        expect(updateRes.statusCode).toBe(400);

        // shouldn't have been updated
        const getRes = await rq.get(`/${res.body.id}`, {
          qs: {
            populate: ['field'],
          },
        });

        expect(getRes.statusCode).toBe(200);
        expect(getRes.body).toMatchObject({
          id: res.body.id,
          field: res.body.field,
        });
      }
    );

    test('Keeps the previous value if component not sent', async () => {
      const res = await rq.post('/', {
        body: {
          field: {
            name: 'someString',
          },
        },
        qs: {
          populate: ['field'],
        },
      });

      const updateRes = await rq.put(`/${res.body.id}`, {
        body: {},
        qs: {
          populate: ['field'],
        },
      });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body).toMatchObject({
        id: res.body.id,
        field: res.body.field,
      });

      const getRes = await rq.get(`/${res.body.id}`, {
        qs: {
          populate: ['field'],
        },
      });

      expect(getRes.statusCode).toBe(200);
      expect(getRes.body).toMatchObject({
        id: res.body.id,
        field: res.body.field,
      });
    });

    test('Removes previous component if null sent', async () => {
      const res = await rq.post('/', {
        body: {
          field: {
            name: 'someString',
          },
        },
        qs: {
          populate: ['field'],
        },
      });

      const updateRes = await rq.put(`/${res.body.id}`, {
        body: {
          field: null,
        },
        qs: {
          populate: ['field'],
        },
      });

      const expectResult = {
        id: res.body.id,
        field: null,
      };

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body).toMatchObject(expectResult);

      const getRes = await rq.get(`/${res.body.id}`, {
        qs: {
          populate: ['field'],
        },
      });

      expect(getRes.statusCode).toBe(200);
      expect(getRes.body).toMatchObject(expectResult);
    });

    test('Replaces the previous component if sent without id', async () => {
      const res = await rq.post('/', {
        body: {
          field: {
            name: 'someString',
          },
        },
        qs: {
          populate: ['field'],
        },
      });

      const updateRes = await rq.put(`/${res.body.id}`, {
        body: {
          field: {
            name: 'new String',
          },
        },
        qs: {
          populate: ['field'],
        },
      });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.field.id).not.toBe(res.body.field.id);
      expect(updateRes.body).toMatchObject({
        id: res.body.id,
        field: {
          name: 'new String',
        },
      });

      const getRes = await rq.get(`/${res.body.id}`, {
        qs: {
          populate: ['field'],
        },
      });

      expect(getRes.statusCode).toBe(200);
      expect(getRes.body).toMatchObject({
        id: res.body.id,
        field: {
          name: 'new String',
        },
      });
    });

    test('Throws on invalid id in component', async () => {
      const res = await rq.post('/', {
        body: {
          field: {
            name: 'someString',
          },
        },
      });

      const updateRes = await rq.put(`/${res.body.id}`, {
        body: {
          field: {
            id: 'invalid_id',
            name: 'new String',
          },
        },
      });

      expect(updateRes.statusCode).toBe(400);
    });

    test('Updates component if previsous component id is sent', async () => {
      const res = await rq.post('/', {
        body: {
          field: {
            name: 'someString',
          },
        },
        qs: {
          populate: ['field'],
        },
      });

      const updateRes = await rq.put(`/${res.body.id}`, {
        body: {
          field: {
            id: res.body.field.id, // send old id to update the previous component
            name: 'new String',
          },
        },
        qs: {
          populate: ['field'],
        },
      });

      const expectedResult = {
        id: res.body.id,
        field: {
          id: res.body.field.id,
          name: 'new String',
        },
      };

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body).toMatchObject(expectedResult);

      const getRes = await rq.get(`/${res.body.id}`, {
        qs: {
          populate: ['field'],
        },
      });

      expect(getRes.statusCode).toBe(200);
      expect(getRes.body).toMatchObject(expectedResult);
    });
  });

  describe('DELETE entry', () => {
    test('Returns entry with components', async () => {
      const res = await rq.post('/', {
        body: {
          field: {
            name: 'someString',
          },
        },
      });

      const deleteRes = await rq.delete(`/${res.body.id}`, {
        qs: {
          populate: ['field'],
        },
      });

      expect(deleteRes.statusCode).toBe(200);
      expect(deleteRes.body).toMatchObject(res.body);

      const getRes = await rq.get(`/${res.body.id}`, {
        qs: {
          populate: ['field'],
        },
      });

      expect(getRes.statusCode).toBe(404);
    });
  });
});
