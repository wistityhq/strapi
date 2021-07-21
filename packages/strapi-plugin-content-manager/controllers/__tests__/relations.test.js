'use strict';

const createContext = require('../../../../test/helpers/create-context');
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
        db: { getModel },
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
        db: { getModel },
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

      const getModelByAssoc = jest.fn();
      const getModel = jest.fn(() => ({
        attributes: { target: { model: 'test' } },
      }));
      global.strapi = {
        db: { getModel, getModelByAssoc },
        plugins: {
          'content-manager': {
            services: {},
          },
        },
      };

      await relations.find(ctx);

      expect(notFound).toHaveBeenCalledWith('target.notFound');
    });

    test('Picks the mainField and primaryKey / id only', async () => {
      const notFound = jest.fn();
      const ctx = createContext(
        {
          params: { model: 'test', targetField: 'target' },
        },
        {
          notFound,
        }
      );

      const getModelByAssoc = jest.fn(() => ({ primaryKey: 'id', attributes: {} }));
      const getModel = jest.fn(() => ({ attributes: { target: { model: 'test' } } }));

      global.strapi = {
        db: {
          getModel,
          getModelByAssoc,
        },
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
      const assocModel = { uid: 'application::test.test', primaryKey: 'id', attributes: {} };
      const notFound = jest.fn();
      const find = jest.fn(() => Promise.resolve(result));
      const findConfiguration = jest.fn(() => Promise.resolve(configuration));
      const getModelByAssoc = jest.fn(() => assocModel);
      const getModel = jest.fn(() => ({ attributes: { target: { model: 'test' } } }));

      global.strapi = {
        db: {
          getModel,
          getModelByAssoc,
        },
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

      expect(find).toHaveBeenCalledWith({ _where: { id_nin: [3, 4] } }, assocModel.uid, []);
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
