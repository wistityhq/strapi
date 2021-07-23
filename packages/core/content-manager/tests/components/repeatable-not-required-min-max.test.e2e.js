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
      repeatable: true,
      required: false,
      min: 2,
      max: 5,
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
          field: [
            {
              name: 'someString',
            },
            {
              name: 'someString',
            },
          ],
        },
        qs: {
          populate: ['field'],
        },
      });

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.field)).toBe(true);
      expect(res.body.field).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.anything(),
            name: 'someString',
          }),
        ])
      );
    });

    test.each(['someString', 128219, false, {}, null])(
      'Throws if the field is not an array %p',
      async value => {
        const res = await rq.post('/', {
          body: {
            field: value,
          },
        });

        expect(res.statusCode).toBe(400);
      }
    );

    test('Throws when sending a non empty array with less then the min', async () => {
      const res = await rq.post('/', {
        body: {
          field: [
            {
              name: 'test',
            },
          ],
        },
      });

      expect(res.statusCode).toBe(400);
    });

    test('Success when sending an empty array', async () => {
      const res = await rq.post('/', {
        body: {
          field: [],
        },
      });

      expect(res.statusCode).toBe(200);
    });

    test('Throws when sending too many items', async () => {
      const res = await rq.post('/', {
        body: {
          field: [
            {
              name: 'one',
            },
            {
              name: 'one',
            },
            {
              name: 'one',
            },
            {
              name: 'one',
            },
            {
              name: 'one',
            },
            {
              name: 'one',
            },
          ],
        },
      });

      expect(res.statusCode).toBe(400);
    });

    test('Can send input without the component field', async () => {
      const res = await rq.post('/', {
        body: {},
        qs: {
          populate: ['field'],
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.field).toEqual([]);
    });
  });

  describe('GET entries', () => {
    test('Data is ordered in the order sent', async () => {
      const res = await rq.post('/', {
        body: {
          field: [
            {
              name: 'firstString',
            },
            {
              name: 'someString',
            },
          ],
        },
        qs: {
          populate: ['field'],
        },
      });

      const getRes = await rq.get(`/${res.body.id}`, {
        qs: {
          populate: ['field'],
        },
      });
      expect(getRes.statusCode).toBe(200);
      expect(Array.isArray(getRes.body.field)).toBe(true);

      expect(getRes.body.field[0]).toMatchObject({
        name: 'firstString',
      });
      expect(getRes.body.field[1]).toMatchObject({
        name: 'someString',
      });
    });

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
          expect(Array.isArray(entry.field)).toBe(true);

          if (entry.field.length === 0) return;

          expect(entry.field).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                name: expect.any(String),
              }),
            ])
          );
        });
        return;
      }

      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach(entry => {
        expect(Array.isArray(entry.field)).toBe(true);

        if (entry.field.length === 0) return;

        expect(entry.field).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: expect.any(String),
            }),
          ])
        );
      });
    });
  });

  describe('PUT entry', () => {
    test.each(['someString', 128219, false, {}, null])(
      'Throws when sending invalid updated field %p',
      async value => {
        const res = await rq.post('/', {
          body: {
            field: [
              {
                name: 'someString',
              },
              {
                name: 'someString',
              },
            ],
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

    test('Updates order at each request', async () => {
      const res = await rq.post('/', {
        body: {
          field: [
            {
              name: 'someString',
            },
            {
              name: 'otherString',
            },
          ],
        },
        qs: {
          populate: ['field'],
        },
      });

      expect(res.body.field[0]).toMatchObject({
        name: 'someString',
      });
      expect(res.body.field[1]).toMatchObject({
        name: 'otherString',
      });

      const updateRes = await rq.put(`/${res.body.id}`, {
        body: {
          field: [
            {
              name: 'otherString',
            },
            {
              name: 'someString',
            },
          ],
        },
        qs: {
          populate: ['field'],
        },
      });

      expect(updateRes.statusCode).toBe(200);
      expect(Array.isArray(updateRes.body.field)).toBe(true);

      expect(updateRes.body.field[0]).toMatchObject({
        name: 'otherString',
      });
      expect(updateRes.body.field[1]).toMatchObject({
        name: 'someString',
      });

      const getRes = await rq.get(`/${res.body.id}`, {
        qs: {
          populate: ['field'],
        },
      });

      expect(getRes.statusCode).toBe(200);
      expect(Array.isArray(getRes.body.field)).toBe(true);

      expect(getRes.body.field[0]).toMatchObject({
        name: 'otherString',
      });
      expect(getRes.body.field[1]).toMatchObject({
        name: 'someString',
      });
    });

    test('Keeps the previous value if component not sent', async () => {
      const res = await rq.post('/', {
        body: {
          field: [
            {
              name: 'someString',
            },
            {
              name: 'otherString',
            },
          ],
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

    test('Throws when not enough items', async () => {
      const res = await rq.post('/', {
        body: {
          field: [
            {
              name: 'someString',
            },
            {
              name: 'new String',
            },
          ],
        },
        qs: {
          populate: ['field'],
        },
      });

      const updateRes = await rq.put(`/${res.body.id}`, {
        body: {
          field: [
            {
              name: 'lala',
            },
          ],
        },
        qs: {
          populate: ['field'],
        },
      });

      expect(updateRes.statusCode).toBe(400);

      const getRes = await rq.get(`/${res.body.id}`, {
        qs: {
          populate: ['field'],
        },
      });

      expect(getRes.statusCode).toBe(200);
      expect(getRes.body).toMatchObject(res.body);
    });

    test('Throws when too many items', async () => {
      const res = await rq.post('/', {
        body: {
          field: [
            {
              name: 'someString',
            },
            {
              name: 'test',
            },
          ],
        },
        qs: {
          populate: ['field'],
        },
      });

      const updateRes = await rq.put(`/${res.body.id}`, {
        body: {
          field: [
            {
              name: 'someString',
            },
            {
              name: 'someString',
            },
            {
              name: 'someString',
            },
            {
              name: 'someString',
            },
            {
              name: 'someString',
            },
            {
              name: 'someString',
            },
          ],
        },
        qs: {
          populate: ['field'],
        },
      });

      expect(updateRes.statusCode).toBe(400);

      const getRes = await rq.get(`/${res.body.id}`, {
        qs: {
          populate: ['field'],
        },
      });

      expect(getRes.statusCode).toBe(200);
      expect(getRes.body).toMatchObject(res.body);
    });

    test('Replaces the previous components if sent without id', async () => {
      const res = await rq.post('/', {
        body: {
          field: [
            {
              name: 'someString',
            },
            { name: 'test' },
          ],
        },
        qs: {
          populate: ['field'],
        },
      });

      const updateRes = await rq.put(`/${res.body.id}`, {
        body: {
          field: [
            {
              name: 'new String',
            },
            {
              name: 'test',
            },
          ],
        },
        qs: {
          populate: ['field'],
        },
      });

      expect(updateRes.statusCode).toBe(200);

      const oldIds = res.body.field.map(val => val.id);
      updateRes.body.field.forEach(val => {
        expect(oldIds.includes(val.id)).toBe(false);
      });

      expect(updateRes.body).toMatchObject({
        id: res.body.id,
        field: [
          {
            name: 'new String',
          },
          {
            name: 'test',
          },
        ],
      });

      const getRes = await rq.get(`/${res.body.id}`, {
        qs: {
          populate: ['field'],
        },
      });

      expect(getRes.statusCode).toBe(200);
      expect(getRes.body).toMatchObject({
        id: res.body.id,
        field: [
          {
            name: 'new String',
          },
          {
            name: 'test',
          },
        ],
      });
    });

    test('Throws on invalid id in component', async () => {
      const res = await rq.post('/', {
        body: {
          field: [
            {
              name: 'someString',
            },
            {
              name: 'test',
            },
          ],
        },
        qs: {
          populate: ['field'],
        },
      });

      const updateRes = await rq.put(`/${res.body.id}`, {
        body: {
          field: [
            {
              id: 'invalid_id',
              name: 'new String',
            },
          ],
        },
        qs: {
          populate: ['field'],
        },
      });

      expect(updateRes.statusCode).toBe(400);
    });

    test('Updates component with ids, create new ones and removes old ones', async () => {
      const res = await rq.post('/', {
        body: {
          field: [
            {
              name: 'one',
            },
            {
              name: 'two',
            },
            {
              name: 'three',
            },
          ],
        },
        qs: {
          populate: ['field'],
        },
      });

      const updateRes = await rq.put(`/${res.body.id}`, {
        body: {
          field: [
            {
              id: res.body.field[0].id, // send old id to update the previous component
              name: 'newOne',
            },
            {
              name: 'newTwo',
            },
            {
              id: res.body.field[2].id,
              name: 'three',
            },
            {
              name: 'four',
            },
          ],
        },
        qs: {
          populate: ['field'],
        },
      });

      const expectedResult = {
        id: res.body.id,
        field: [
          {
            id: res.body.field[0].id,
            name: 'newOne',
          },
          {
            name: 'newTwo',
          },
          {
            id: res.body.field[2].id,
            name: 'three',
          },
          {
            name: 'four',
          },
        ],
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
          field: [
            {
              name: 'someString',
            },
            {
              name: 'someOtherString',
            },
            {
              name: 'otherSomeString',
            },
          ],
        },
        qs: {
          populate: ['field'],
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
