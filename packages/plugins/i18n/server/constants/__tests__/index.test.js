'use strict';

const { getInitLocale } = require('../');

describe('I18N default locale', () => {
  describe('getInitLocale', () => {
    test('The init locale is english by default', () => {
      expect(getInitLocale()).toStrictEqual({
        code: 'en',
        name: 'English (en)',
      });
    });

    test('The init locale can be configured by an env var', () => {
      process.env.STRAPI_PLUGIN_I18N_INIT_LOCALE_CODE = 'fr';
      expect(getInitLocale()).toStrictEqual({
        code: 'fr',
        name: 'French (fr)',
      });
    });

    test('Throws if env var code is unknown in iso list', () => {
      process.env.STRAPI_PLUGIN_I18N_INIT_LOCALE_CODE = 'zzzzz';
      expect(() => getInitLocale()).toThrow();
    });
  });
});
