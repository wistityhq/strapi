'use strict';

const { getRelationalFields } = require('../relations');

describe('Relations', () => {
  describe('getRelationalFields', () => {
    test('Attribute must have a type relation', () => {
      expect(
        getRelationalFields({
          attributes: {
            rel: {
              type: 'relation',
            },
            title: {
              type: 'string',
            },
          },
        })
      ).toEqual(['rel']);
    });
  });
});
