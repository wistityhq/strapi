'use strict';

const { getIsoLocales } = require('../iso-locales');

describe('ISO locales', () => {
  test('getIsoLocales', () => {
    const locales = getIsoLocales();

    expect(locales).toMatchSnapshot();
  });
});
