'use strict';

jest.mock('../localizations', () => {
  return {
    syncLocalizations: jest.fn(async () => {}),
    syncNonLocalizedAttributes: jest.fn(async () => {}),
  };
});

const { decorator } = require('../entity-service-decorator');
const { syncLocalizations, syncNonLocalizedAttributes } = require('../localizations');
const locales = require('../locales');
const contentTypes = require('../content-types');

const model = {
  pluginOptions: {
    i18n: {
      localized: true,
    },
  },
};

const nonLocalizedModel = {
  pluginOptions: {
    i18n: {
      localized: false,
    },
  },
};

const models = {
  'test-model': model,
  'non-localized-model': nonLocalizedModel,
};

describe('Entity service decorator', () => {
  beforeAll(() => {
    global.strapi = {
      plugins: {
        i18n: {
          services: {
            locales,
            'content-types': contentTypes,
          },
        },
      },
      query() {
        return {
          create() {},
          update() {},
        };
      },
      getModel(uid) {
        return models[uid || 'test-model'];
      },
      store: () => ({ get: () => 'en' }),
    };
  });

  beforeEach(() => {
    syncLocalizations.mockClear();
    syncNonLocalizedAttributes.mockClear();
  });

  describe('wrapOptions', () => {
    test('Calls original wrapOptions', async () => {
      const defaultService = {
        wrapOptions: jest.fn(() => Promise.resolve('li')),
      };

      const service = decorator(defaultService);

      const input = { populate: ['test'] };
      await service.wrapOptions(input, { uid: 'test-model' });

      expect(defaultService.wrapOptions).toHaveBeenCalledWith(input, { uid: 'test-model' });
    });

    test('Does not wrap options if model is not localized', async () => {
      const defaultService = {
        wrapOptions: jest.fn(opts => Promise.resolve(opts)),
      };
      const service = decorator(defaultService);

      const input = { populate: ['test'] };
      const output = await service.wrapOptions(input, { uid: 'non-localized-model' });

      expect(output).toStrictEqual(input);
    });

    test('does not change non params options', async () => {
      const defaultService = {
        wrapOptions: jest.fn(opts => Promise.resolve(opts)),
      };
      const service = decorator(defaultService);

      const input = { populate: ['test'] };
      const output = await service.wrapOptions(input, { uid: 'test-model' });

      expect(output.populate).toStrictEqual(input.populate);
    });

    test('Adds locale param', async () => {
      const defaultService = {
        wrapOptions: jest.fn(opts => Promise.resolve(opts)),
      };
      const service = decorator(defaultService);

      const input = { populate: ['test'] };
      const output = await service.wrapOptions(input, { uid: 'test-model' });

      expect(output).toMatchObject({ params: { filters: { $and: [{ locale: 'en' }] } } });
    });

    const testData = [
      ['findOne', { filters: { id: 1 } }],
      ['update', { filters: { id: 1 } }],
      ['delete', { filters: { id: 1 } }],
      ['delete', { filters: { id: { $in: [1] } } }],
      ['findOne', { filters: [{ id: 1 }] }],
      ['update', { filters: [{ id: 1 }] }],
      ['delete', { filters: [{ id: 1 }] }],
      ['delete', { filters: [{ id: { $in: [1] } }] }],
    ];

    test.each(testData)(
      "Doesn't add locale param when the params contain id or id_in - %s",
      async (action, params) => {
        const defaultService = {
          wrapOptions: jest.fn(opts => Promise.resolve(opts)),
        };
        const service = decorator(defaultService);

        const input = Object.assign({ populate: ['test'], params });
        const output = await service.wrapOptions(input, { uid: 'test-model', action });

        expect(output).toEqual({ populate: ['test'], params });
      }
    );

    test('Replaces _locale param', async () => {
      const defaultService = {
        wrapOptions: jest.fn(opts => Promise.resolve(opts)),
      };
      const service = decorator(defaultService);

      const input = {
        params: {
          locale: 'fr',
        },
        populate: ['test'],
      };
      const output = await service.wrapOptions(input, { uid: 'test-model' });

      expect(output).toMatchObject({ params: { filters: { $and: [{ locale: 'fr' }] } } });
    });
  });

  describe('create', () => {
    test('Calls original create', async () => {
      const entry = {
        id: 1,
      };

      const defaultService = {
        create: jest.fn(() => Promise.resolve(entry)),
      };

      const service = decorator(defaultService);

      const input = { data: { title: 'title ' } };
      await service.create('test-model', input);

      expect(defaultService.create).toHaveBeenCalledWith('test-model', input);
    });

    test('Calls syncLocalizations if model is localized', async () => {
      const entry = {
        id: 1,
        localizations: [{ id: 2 }],
      };

      const defaultService = {
        create: jest.fn(() => Promise.resolve(entry)),
      };

      const service = decorator(defaultService);

      const input = { data: { title: 'title ' } };
      await service.create('test-model', input);

      expect(defaultService.create).toHaveBeenCalledWith('test-model', input);
      expect(syncLocalizations).toHaveBeenCalledWith(entry, { model });
    });

    test('Skip processing if model is not localized', async () => {
      const entry = {
        id: 1,
        localizations: [{ id: 2 }],
      };

      const defaultService = {
        create: jest.fn(() => Promise.resolve(entry)),
      };

      const service = decorator(defaultService);

      const input = { data: { title: 'title ' } };
      const output = await service.create('non-localized-model', input);

      expect(defaultService.create).toHaveBeenCalledWith('non-localized-model', input);
      expect(syncLocalizations).not.toHaveBeenCalled();
      expect(output).toStrictEqual(entry);
    });
  });

  describe('update', () => {
    test('Calls original update', async () => {
      const entry = {
        id: 1,
      };

      const defaultService = {
        update: jest.fn(() => Promise.resolve(entry)),
      };

      const service = decorator(defaultService);

      const input = { data: { title: 'title ' } };
      await service.update('test-model', 1, input);

      expect(defaultService.update).toHaveBeenCalledWith('test-model', 1, input);
    });

    test('Calls syncNonLocalizedAttributes if model is localized', async () => {
      const entry = {
        id: 1,
        localizations: [{ id: 2 }],
      };

      const defaultService = {
        update: jest.fn(() => Promise.resolve(entry)),
      };

      const service = decorator(defaultService);

      const input = { data: { title: 'title ' } };
      const output = await service.update('test-model', 1, input);

      expect(defaultService.update).toHaveBeenCalledWith('test-model', 1, input);
      expect(syncNonLocalizedAttributes).toHaveBeenCalledWith(entry, { model });
      expect(output).toStrictEqual(entry);
    });

    test('Skip processing if model is not localized', async () => {
      const entry = {
        id: 1,
        localizations: [{ id: 2 }],
      };

      const defaultService = {
        update: jest.fn(() => Promise.resolve(entry)),
      };

      const service = decorator(defaultService);

      const input = { data: { title: 'title ' } };
      await service.update('non-localized-model', 1, input);

      expect(defaultService.update).toHaveBeenCalledWith('non-localized-model', 1, input);
      expect(syncNonLocalizedAttributes).not.toHaveBeenCalled();
    });
  });
});
