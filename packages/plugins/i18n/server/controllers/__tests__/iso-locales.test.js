'use strict';

const { listIsoLocales } = require('../iso-locales');

describe('ISO locales', () => {
  test('listIsoLocales', () => {
    const isoLocales = [{ code: 'af', name: 'Afrikaans (af)' }];
    const getIsoLocales = jest.fn(() => isoLocales);
    global.strapi = {
      plugins: {
        i18n: {
          services: {
            'iso-locales': {
              getIsoLocales,
            },
          },
        },
      },
    };

    const ctx = {};
    listIsoLocales(ctx);

    expect(ctx.body).toMatchObject(isoLocales);
  });
});
