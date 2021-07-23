'use strict';

const createContext = require('../../../../../test/helpers/create-context');
const relations = require('../relations');

describe('Relations', () => {
  describe('find', () => {
    test('Fails on model not found', async () => {
      const notFound = jest.fn();
      const ctx = createContext(
        {
          params: { model: 'test', targetField: 'field' },
        },
        {
          notFound,
        }
      );

      const getModel = jest.fn();
      global.strapi = {
        getModel,
        plugins: {
          'content-manager': {
            services: {},
          },
        },
      };

      await relations.find(ctx);

      expect(notFound).toHaveBeenCalledWith('model.notFound');
    });

    test('Fails on invalid target field', async () => {
      const badRequest = jest.fn();
      const ctx = createContext(
        {
          params: { model: 'test', targetField: 'field' },
        },
        {
          badRequest,
        }
      );

      const getModel = jest.fn(() => ({
        attributes: {},
      }));

      global.strapi = {
        getModel,
        plugins: {
          'content-manager': {
            services: {},
          },
        },
      };

      await relations.find(ctx);

      expect(badRequest).toHaveBeenCalledWith('targetField.invalid');
    });

    test('Fails on model not found', async () => {
      const notFound = jest.fn();
      const ctx = createContext(
        {
          params: { model: 'test', targetField: 'target' },
        },
        {
          notFound,
        }
      );

      const getModel = jest
        .fn()
        .mockReturnValueOnce({
          attributes: { target: { type: 'relation', target: 'test' } },
        })
        .mockReturnValueOnce(null);

      global.strapi = {
        getModel,
        plugins: {
          'content-manager': {
            services: {},
          },
        },
      };

      await relations.find(ctx);

      expect(notFound).toHaveBeenCalledWith('target.notFound');
    });

    test('Picks the mainField and id only', async () => {
      const notFound = jest.fn();
      const ctx = createContext(
        {
          params: { model: 'test', targetField: 'target' },
        },
        {
          notFound,
        }
      );

      const getModel = jest.fn(() => ({
        attributes: { target: { type: 'relation', target: 'test' } },
      }));

      global.strapi = {
        getModel,
        plugins: {
          'content-manager': {
            services: {
              'content-types': {
                findConfiguration() {
                  return {
                    metadatas: {
                      target: {
                        edit: {
                          mainField: 'title',
                        },
                      },
                    },
                  };
                },
              },
              'entity-manager': {
                find() {
                  return [
                    {
                      id: 1,
                      title: 'title1',
                      secret: 'some secret',
                    },
                    {
                      id: 2,
                      title: 'title2',
                      secret: 'some secret 2',
                    },
                  ];
                },
              },
            },
          },
        },
      };

      await relations.find(ctx);

      expect(ctx.body).toEqual([
        {
          id: 1,
          title: 'title1',
        },
        {
          id: 2,
          title: 'title2',
        },
      ]);
    });

    test('Omit somes ids', async () => {
      const result = [
        {
          id: 1,
          title: 'title1',
          secret: 'some secret',
        },
        {
          id: 2,
          title: 'title2',
          secret: 'some secret 2',
        },
      ];
      const configuration = {
        metadatas: {
          target: {
            edit: {
              mainField: 'title',
            },
          },
        },
      };
      const assocModel = { uid: 'application::test.test', attributes: {} };
      const notFound = jest.fn();
      const find = jest.fn(() => Promise.resolve(result));
      const findConfiguration = jest.fn(() => Promise.resolve(configuration));

      const getModel = jest
        .fn()
        .mockImplementationOnce(() => ({
          attributes: { target: { type: 'relation', target: 'test' } },
        }))
        .mockImplementationOnce(() => assocModel);

      global.strapi = {
        getModel,
        plugins: {
          'content-manager': {
            services: {
              'content-types': { findConfiguration },
              'entity-manager': { find },
            },
          },
        },
      };

      const ctx = createContext(
        {
          params: { model: 'test', targetField: 'target' },
          body: { idsToOmit: [3, 4] },
        },
        {
          notFound,
        }
      );

      await relations.find(ctx);

      expect(find).toHaveBeenCalledWith(
        { filters: { $and: [{ id: { $notIn: [3, 4] } }] } },
        assocModel.uid
      );
      expect(ctx.body).toEqual([
        {
          id: 1,
          title: 'title1',
        },
        {
          id: 2,
          title: 'title2',
        },
      ]);
    });
  });
});
