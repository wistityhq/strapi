'use strict';

const {
  isLocalizedContentType,
  getValidLocale,
  getNewLocalizationsFrom,
  getAndValidateRelatedEntity,
  getNonLocalizedAttributes,
  copyNonLocalizedAttributes,
  fillNonLocalizedAttributes,
} = require('../content-types');

describe('content-types service', () => {
  describe('isLocalizedContentType', () => {
    test('Checks for the i18N option', () => {
      expect(isLocalizedContentType({ pluginOptions: { i18n: { localized: false } } })).toBe(false);
      expect(isLocalizedContentType({ pluginOptions: { i18n: { localized: true } } })).toBe(true);
    });

    test('Defaults to false', () => {
      expect(isLocalizedContentType({})).toBe(false);
      expect(isLocalizedContentType({ pluginOptions: {} })).toBe(false);
      expect(isLocalizedContentType({ pluginOptions: { i18n: {} } })).toBe(false);
    });
  });

  describe('getNonLocalizedAttributes', () => {
    test('Uses the pluginOptions to detect non localized fields', () => {
      expect(
        getNonLocalizedAttributes({
          uid: 'test-model',
          attributes: {
            title: {
              type: 'string',
              pluginOptions: {
                i18n: {
                  localized: true,
                },
              },
            },
            stars: {
              type: 'integer',
            },
            price: {
              type: 'integer',
            },
          },
        })
      ).toEqual(['stars', 'price']);
    });

    test('Consider relations to be always localized', () => {
      expect(
        getNonLocalizedAttributes({
          uid: 'test-model',
          attributes: {
            title: {
              type: 'string',
              pluginOptions: {
                i18n: {
                  localized: true,
                },
              },
            },
            stars: {
              type: 'integer',
            },
            price: {
              type: 'integer',
            },
            relation: {
              type: 'relation',
              relation: 'oneToOne',
              target: 'user',
            },
            secondRelation: {
              type: 'relation',
              relation: 'oneToMany',
              target: 'user',
            },
          },
        })
      ).toEqual(['stars', 'price']);
    });

    test('Consider locale, localizations & published_at as localized', () => {
      expect(
        getNonLocalizedAttributes({
          uid: 'test-model',
          attributes: {
            title: {
              type: 'string',
              pluginOptions: {
                i18n: {
                  localized: true,
                },
              },
            },
            stars: {
              type: 'integer',
            },
            price: {
              type: 'integer',
            },
            locale: {
              type: 'string',
              visible: false,
            },
            localizations: {
              type: 'relation',
              relation: 'oneToMany',
              target: 'test-model',
              visible: false,
            },
            published_at: {
              type: 'datetime',
              visible: false,
            },
          },
        })
      ).toEqual(['stars', 'price']);
    });

    test('Consider uid to always be localized', () => {
      expect(
        getNonLocalizedAttributes({
          attributes: {
            price: {
              type: 'integer',
            },
            slug: {
              type: 'uid',
            },
          },
        })
      ).toEqual(['price']);
    });
  });

  describe('getValidLocale', () => {
    test('set default locale if the provided one is nil', async () => {
      const getDefaultLocale = jest.fn(() => Promise.resolve('en'));
      global.strapi = {
        plugins: {
          i18n: {
            services: {
              locales: {
                getDefaultLocale,
              },
            },
          },
        },
      };
      const locale = await getValidLocale(null);

      expect(locale).toBe('en');
    });

    test('set locale to the provided one if it exists', async () => {
      const findByCode = jest.fn(() => Promise.resolve('en'));
      global.strapi = {
        plugins: {
          i18n: {
            services: {
              locales: {
                findByCode,
              },
            },
          },
        },
      };
      const locale = await getValidLocale('en');

      expect(locale).toBe('en');
    });

    test("throw if provided locale doesn't exist", async () => {
      const findByCode = jest.fn(() => Promise.resolve(undefined));
      global.strapi = {
        plugins: {
          i18n: {
            services: {
              locales: {
                findByCode,
              },
            },
          },
        },
      };
      try {
        await getValidLocale('en');
      } catch (e) {
        expect(e.message).toBe('Locale not found');
      }

      expect(findByCode).toHaveBeenCalledWith('en');
      expect.assertions(2);
    });
  });

  describe.each([['singleType'], ['collectionType']])('getAndValidateRelatedEntity - %s', kind => {
    test("Throw if relatedEntity is provided but doesn't exist", async () => {
      const findOne = jest.fn(() => Promise.resolve(undefined));
      const relatedEntityId = 1;
      const model = 'application::country.country';
      const locale = 'fr';

      global.strapi = {
        query: () => ({
          findOne,
        }),
        getModel: () => ({ kind }),
      };

      try {
        await getAndValidateRelatedEntity(relatedEntityId, model, locale);
      } catch (e) {
        expect(e.message).toBe("The related entity doesn't exist");
      }

      expect(findOne).toHaveBeenCalledWith(
        kind === 'singleType'
          ? { populate: ['localizations'] }
          : { where: { id: relatedEntityId }, populate: ['localizations'] }
      );
      expect.assertions(2);
    });

    test('Throw if locale already exists (1/2)', async () => {
      const relatedEntityId = 1;
      const relatedEntity = {
        id: relatedEntityId,
        locale: 'en',
        localizations: [],
      };
      const findOne = jest.fn(() => Promise.resolve(relatedEntity));
      const model = 'application::country.country';
      const locale = 'en';

      global.strapi = {
        query: () => ({
          findOne,
        }),
        getModel: () => ({ kind }),
      };

      try {
        await getAndValidateRelatedEntity(relatedEntityId, model, locale);
      } catch (e) {
        expect(e.message).toBe('The entity already exists in this locale');
      }

      expect(findOne).toHaveBeenCalledWith(
        kind === 'singleType'
          ? { populate: ['localizations'] }
          : { where: { id: relatedEntityId }, populate: ['localizations'] }
      );
      expect.assertions(2);
    });

    test('Throw if locale already exists (2/2)', async () => {
      const relatedEntityId = 1;
      const relatedEntity = {
        id: relatedEntityId,
        locale: 'fr',
        localizations: [
          {
            id: 2,
            locale: 'en',
          },
        ],
      };
      const findOne = jest.fn(() => Promise.resolve(relatedEntity));
      const model = 'application::country.country';
      const locale = 'en';

      global.strapi = {
        query: () => ({
          findOne,
        }),
        getModel: () => ({ kind }),
      };

      try {
        await getAndValidateRelatedEntity(relatedEntityId, model, locale);
      } catch (e) {
        expect(e.message).toBe('The entity already exists in this locale');
      }

      expect(findOne).toHaveBeenCalledWith(
        kind === 'singleType'
          ? { populate: ['localizations'] }
          : { where: { id: relatedEntityId }, populate: ['localizations'] }
      );
      expect.assertions(2);
    });

    test('get related entity', async () => {
      const relatedEntityId = 1;
      const relatedEntity = {
        id: relatedEntityId,
        locale: 'fr',
        localizations: [
          {
            id: 2,
            locale: 'en',
          },
        ],
      };
      const findOne = jest.fn(() => Promise.resolve(relatedEntity));
      const model = 'application::country.country';
      const locale = 'it';

      global.strapi = {
        query: () => ({
          findOne,
        }),
        getModel: () => ({ kind }),
      };

      const foundEntity = await getAndValidateRelatedEntity(relatedEntityId, model, locale);

      expect(foundEntity).toEqual(relatedEntity);
      expect(findOne).toHaveBeenCalledWith(
        kind === 'singleType'
          ? { populate: ['localizations'] }
          : { where: { id: relatedEntityId }, populate: ['localizations'] }
      );
      expect.assertions(2);
    });
  });

  describe('getNewLocalizationsFrom', () => {
    test('Can get localizations', async () => {
      const relatedEntity = {
        id: 1,
        locale: 'fr',
        localizations: [
          {
            id: 2,
            locale: 'en',
          },
          {
            id: 3,
            locale: 'it',
          },
        ],
      };

      const localizations = await getNewLocalizationsFrom(relatedEntity);

      expect(localizations).toEqual([1, 2, 3]);
    });

    test('Add empty localizations if none exist (CT)', async () => {
      const localizations = await getNewLocalizationsFrom(undefined);

      expect(localizations).toEqual([]);
    });
  });

  describe('copyNonLocalizedAttributes', () => {
    test('Does not copy locale, localizations & published_at', () => {
      const model = {
        attributes: {
          title: {
            type: 'string',
            pluginOptions: {
              i18n: { localized: true },
            },
          },
          price: {
            type: 'integer',
          },
          relation: {
            type: 'relation',
          },
          description: {
            type: 'string',
          },
          locale: {
            type: 'string',
            visible: false,
          },
          localizations: {
            collection: 'test-model',
            visible: false,
          },
          published_at: {
            type: 'datetime',
            visible: false,
          },
        },
      };

      const input = {
        id: 1,
        title: 'My custom title',
        price: 25,
        relation: 1,
        description: 'My super description',
        locale: 'en',
        localizations: [1, 2, 3],
        published_at: '2021-03-18T09:47:37.557Z',
      };

      const result = copyNonLocalizedAttributes(model, input);
      expect(result).toStrictEqual({
        price: input.price,
        description: input.description,
      });
    });

    test('picks only non localized attributes', () => {
      const model = {
        attributes: {
          title: {
            type: 'string',
            pluginOptions: {
              i18n: { localized: true },
            },
          },
          price: {
            type: 'integer',
          },
          relation: {
            type: 'relation',
          },
          description: {
            type: 'string',
          },
        },
      };

      const input = {
        id: 1,
        title: 'My custom title',
        price: 25,
        relation: 1,
        description: 'My super description',
      };

      const result = copyNonLocalizedAttributes(model, input);
      expect(result).toStrictEqual({
        price: input.price,
        description: input.description,
      });
    });

    test('Removes ids', () => {
      const compoModel = {
        attributes: {
          name: { type: 'string' },
        },
      };

      global.strapi = {
        components: {
          compo: compoModel,
        },
      };

      const model = {
        attributes: {
          title: {
            type: 'string',
            pluginOptions: {
              i18n: { localized: true },
            },
          },
          price: {
            type: 'integer',
          },
          relation: {
            type: 'relation',
          },
          component: {
            type: 'component',
            component: 'compo',
          },
        },
      };

      const input = {
        id: 1,
        title: 'My custom title',
        price: 25,
        relation: 1,
        component: {
          id: 2,
          name: 'Hello',
        },
      };

      const result = copyNonLocalizedAttributes(model, input);
      expect(result).toEqual({
        price: 25,
        component: {
          name: 'Hello',
        },
      });
    });
  });

  describe('fillNonLocalizedAttributes', () => {
    test('fill non localized attributes', () => {
      const entry = {
        a: 'a',
        b: undefined,
        c: null,
        d: 1,
        e: {},
        la: 'a',
        lb: undefined,
        lc: null,
        ld: 1,
        le: {},
      };

      const relatedEntry = {
        a: 'a',
        b: 'b',
        c: 'c',
        d: 'd',
        e: 'e',
        la: 'la',
        lb: 'lb',
        lc: 'lc',
        ld: 'ld',
        le: 'le',
      };

      const modelDef = {
        attributes: {
          a: {},
          b: {},
          c: {},
          d: {},
          e: {},
          la: { pluginOptions: { i18n: { localized: true } } },
          lb: { pluginOptions: { i18n: { localized: true } } },
          lc: { pluginOptions: { i18n: { localized: true } } },
          ld: { pluginOptions: { i18n: { localized: true } } },
          le: { pluginOptions: { i18n: { localized: true } } },
        },
      };

      const getModel = jest.fn(() => modelDef);
      global.strapi = { getModel };

      fillNonLocalizedAttributes(entry, relatedEntry, { model: 'model' });

      expect(entry).toEqual({
        a: 'a',
        b: 'b',
        c: 'c',
        d: 1,
        e: {},
        la: 'a',
        lb: undefined,
        lc: null,
        ld: 1,
        le: {},
      });
    });
  });
});
