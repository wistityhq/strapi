'use strict';

const { listLocales, createLocale, updateLocale, deleteLocale } = require('../locales');
const localeModel = require('../../content-types/locale');

describe('Locales', () => {
  describe('listLocales', () => {
    test('can get locales', async () => {
      const locales = [{ code: 'af', name: 'Afrikaans (af)' }];
      const expectedLocales = [{ code: 'af', name: 'Afrikaans (af)', isDefault: true }];
      const setIsDefault = jest.fn(() => expectedLocales);
      const find = jest.fn(() => locales);
      const getModel = jest.fn(() => localeModel);
      global.strapi = {
        getModel,
        plugins: {
          i18n: {
            services: {
              locales: {
                find,
                setIsDefault,
              },
            },
          },
        },
      };

      const ctx = {};
      await listLocales(ctx);

      expect(setIsDefault).toHaveBeenCalledWith(locales);
      expect(find).toHaveBeenCalledWith();
      expect(ctx.body).toMatchObject(expectedLocales);
    });
  });

  describe('createLocale', () => {
    test('can create a locale (isDefault: true)', async () => {
      const locale = { code: 'af', name: 'Afrikaans (af)' };
      const expectedLocales = { code: 'af', name: 'Afrikaans (af)', isDefault: true };
      const getDefaultLocale = jest.fn(() => Promise.resolve('af'));
      const setDefaultLocale = jest.fn(() => Promise.resolve());

      const setIsDefault = jest.fn(() => expectedLocales);
      const findByCode = jest.fn(() => undefined);
      const create = jest.fn(() => Promise.resolve(locale));
      const getModel = jest.fn(() => localeModel);
      global.strapi = {
        getModel,
        plugins: {
          i18n: {
            services: {
              locales: {
                findByCode,
                setIsDefault,
                getDefaultLocale,
                setDefaultLocale,
                create,
              },
            },
          },
        },
      };

      const ctx = { request: { body: { ...locale, isDefault: true } }, state: { user: { id: 1 } } };
      await createLocale(ctx);

      expect(setIsDefault).toHaveBeenCalledWith(locale);
      expect(setDefaultLocale).toHaveBeenCalledWith(locale);
      expect(findByCode).toHaveBeenCalledWith('af');
      expect(create).toHaveBeenCalledWith({ created_by: 1, updated_by: 1, ...locale });
      expect(ctx.body).toMatchObject(expectedLocales);
    });

    test('can create a locale (isDefault: false)', async () => {
      const locale = { code: 'af', name: 'Afrikaans (af)' };
      const expectedLocale = { code: 'af', name: 'Afrikaans (af)', isDefault: false };
      const getDefaultLocale = jest.fn(() => Promise.resolve('en'));

      const setIsDefault = jest.fn(() => expectedLocale);
      const findByCode = jest.fn(() => undefined);
      const create = jest.fn(() => Promise.resolve(locale));
      const getModel = jest.fn(() => localeModel);
      global.strapi = {
        getModel,
        plugins: {
          i18n: {
            services: {
              locales: {
                findByCode,
                setIsDefault,
                getDefaultLocale,
                create,
              },
            },
          },
        },
      };

      const ctx = {
        request: { body: { ...locale, isDefault: false } },
        state: { user: { id: 1 } },
      };
      await createLocale(ctx);

      expect(setIsDefault).toHaveBeenCalledWith(locale);
      expect(findByCode).toHaveBeenCalledWith('af');
      expect(create).toHaveBeenCalledWith({ created_by: 1, updated_by: 1, ...locale });
      expect(ctx.body).toMatchObject(expectedLocale);
    });

    test('cannot create a locale that already exists', async () => {
      const locale = { code: 'af', name: 'Afrikaans (af)' };
      const expectedLocale = { code: 'af', name: 'Afrikaans (af)', isDefault: false };
      const getDefaultLocale = jest.fn(() => Promise.resolve('en'));

      const setIsDefault = jest.fn(() => expectedLocale);
      const findByCode = jest.fn(() => ({ name: 'other locale', code: 'af' }));
      const create = jest.fn(() => Promise.resolve(locale));
      const badRequest = jest.fn();
      const getModel = jest.fn(() => localeModel);
      global.strapi = {
        getModel,
        plugins: {
          i18n: {
            services: {
              locales: {
                findByCode,
                setIsDefault,
                getDefaultLocale,
                create,
              },
            },
          },
        },
      };

      const ctx = {
        badRequest,
        request: { body: { ...locale, isDefault: false } },
        state: { user: { id: 1 } },
      };
      await createLocale(ctx);

      expect(findByCode).toHaveBeenCalledWith('af');
      expect(badRequest).toHaveBeenCalledWith('This locale already exists');
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe('updateLocale', () => {
    test('can update a locale', async () => {
      const updatedLocale = { name: 'Afrikaans', code: 'af' };
      const existingLocale = { name: 'Afrikaans (af)', code: 'af' };
      const updates = { name: 'Afrikaans' };
      const expectedLocales = { code: 'af', name: 'Afrikaans', isDefault: true };
      const setDefaultLocale = jest.fn(() => Promise.resolve());

      const setIsDefault = jest.fn(() => expectedLocales);
      const findById = jest.fn(() => existingLocale);
      const update = jest.fn(() => Promise.resolve(updatedLocale));
      const getModel = jest.fn(() => localeModel);
      global.strapi = {
        getModel,
        plugins: {
          i18n: {
            services: {
              locales: {
                findById,
                setIsDefault,
                setDefaultLocale,
                update,
              },
            },
          },
        },
      };

      const ctx = {
        params: { id: 1 },
        request: { body: { ...updates, isDefault: true } },
        state: { user: { id: 1 } },
      };
      await updateLocale(ctx);

      expect(setIsDefault).toHaveBeenCalledWith(updatedLocale);
      expect(setDefaultLocale).toHaveBeenCalledWith(updatedLocale);
      expect(findById).toHaveBeenCalledWith(1);
      expect(update).toHaveBeenCalledWith({ id: 1 }, { updated_by: 1, ...updates });
      expect(ctx.body).toMatchObject(expectedLocales);
    });

    test('cannot update the code of a locale', async () => {
      const updatedLocale = { name: 'Afrikaans', code: 'af' };
      const existingLocale = { name: 'Afrikaans (af)', code: 'af' };
      const updates = { name: 'Afrikaans', code: 'fr' };
      const expectedLocales = { code: 'af', name: 'Afrikaans', isDefault: true };
      const setDefaultLocale = jest.fn(() => Promise.resolve());

      const setIsDefault = jest.fn(() => expectedLocales);
      const findById = jest.fn(() => existingLocale);
      const update = jest.fn(() => Promise.resolve(updatedLocale));
      const getModel = jest.fn(() => localeModel);
      const badRequest = jest.fn();
      global.strapi = {
        getModel,
        plugins: {
          i18n: {
            services: {
              locales: {
                findById,
                setIsDefault,
                setDefaultLocale,
                update,
              },
            },
          },
        },
      };

      const ctx = {
        badRequest,
        params: { id: 1 },
        request: { body: { ...updates, isDefault: true } },
        state: { user: { id: 1 } },
      };

      await updateLocale(ctx);

      expect(badRequest).toHaveBeenCalled();
      expect(findById).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
      expect(setIsDefault).not.toHaveBeenCalled();
      expect(setDefaultLocale).not.toHaveBeenCalled();
    });
  });

  describe('deleteLocale', () => {
    test('can delete a locale', async () => {
      const locale = { code: 'af', name: 'Afrikaans (af)' };
      const expectedLocales = { code: 'af', name: 'Afrikaans (af)', isDefault: false };
      const getDefaultLocale = jest.fn(() => Promise.resolve('en'));

      const setIsDefault = jest.fn(() => expectedLocales);
      const findById = jest.fn(() => locale);
      const deleteFn = jest.fn();
      const getModel = jest.fn(() => localeModel);
      global.strapi = {
        getModel,
        plugins: {
          i18n: {
            services: {
              locales: {
                findById,
                setIsDefault,
                getDefaultLocale,
                delete: deleteFn,
              },
            },
          },
        },
      };

      const ctx = { params: { id: 1 } };
      await deleteLocale(ctx);

      expect(setIsDefault).toHaveBeenCalledWith(locale);
      expect(findById).toHaveBeenCalledWith(1);
      expect(deleteFn).toHaveBeenCalledWith({ id: 1 });
      expect(ctx.body).toMatchObject(expectedLocales);
    });

    test('cannot delete the default locale', async () => {
      const locale = { code: 'af', name: 'Afrikaans (af)' };
      const expectedLocales = { code: 'af', name: 'Afrikaans (af)', isDefault: false };
      const getDefaultLocale = jest.fn(() => Promise.resolve('af'));

      const setIsDefault = jest.fn(() => Promise.resolve(expectedLocales));
      const findById = jest.fn(() => Promise.resolve(locale));
      const badRequest = jest.fn();
      const deleteFn = jest.fn();
      const getModel = jest.fn(() => localeModel);
      global.strapi = {
        getModel,
        plugins: {
          i18n: {
            services: {
              locales: {
                findById,
                getDefaultLocale,
                delete: deleteFn,
              },
            },
          },
        },
      };

      const ctx = { params: { id: 1 }, badRequest };
      await deleteLocale(ctx);

      expect(badRequest).toHaveBeenCalledWith('Cannot delete the default locale');

      expect(findById).toHaveBeenCalledWith(1);
      expect(setIsDefault).not.toHaveBeenCalled();
      expect(deleteFn).not.toHaveBeenCalled();
    });
  });
});
