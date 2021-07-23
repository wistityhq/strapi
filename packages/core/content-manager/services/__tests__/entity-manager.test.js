'use strict';

const entityManager = require('../entity-manager');

describe('Content-Manager', () => {
  const fakeModel = {
    modelName: 'fake model',
    attributes: {},
  };

  describe('Publish', () => {
    beforeEach(() => {
      global.strapi = {
        entityService: {
          update: jest.fn(),
        },
        entityValidator: {
          validateEntityCreation() {},
        },
        eventHub: { emit: jest.fn() },
        getModel: jest.fn(() => fakeModel),
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('Publish a content-type', async () => {
      const uid = 'application::test.test';
      const entity = { id: 1, published_at: null };
      await entityManager.publish(entity, uid);

      expect(strapi.entityService.update).toBeCalledWith(uid, entity.id, {
        data: { published_at: expect.any(Date) },
        params: {
          populate: [],
        },
      });
    });
  });

  describe('Unpublish', () => {
    beforeEach(() => {
      global.strapi = {
        entityService: {
          update: jest.fn(),
        },
        eventHub: { emit: jest.fn() },
        getModel: jest.fn(() => fakeModel),
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('Unpublish a content-type', async () => {
      const uid = 'application::test.test';
      const entity = { id: 1, published_at: new Date() };
      await entityManager.unpublish(entity, uid);

      expect(strapi.entityService.update).toHaveBeenCalledWith(uid, entity.id, {
        data: { published_at: null },
        params: {
          populate: [],
        },
      });
    });
  });
});
