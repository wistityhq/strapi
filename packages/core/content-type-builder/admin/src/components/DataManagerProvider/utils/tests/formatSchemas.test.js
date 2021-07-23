import formatSchemas, { toAttributesArray } from '../formatSchemas';

describe('CONTENT TYPE BUILDER | components | DataManagerProvider | utils ', () => {
  describe('toAttributesArray', () => {
    it('should return an array of attributes', () => {
      const attributes = {
        name: { type: 'string', pluginOptions: { i18n: { enabled: false } } },
        price: { type: 'integer' },
      };

      const expected = [
        { type: 'string', name: 'name', pluginOptions: { i18n: { enabled: false } } },
        { type: 'integer', name: 'price' },
      ];

      expect(toAttributesArray(attributes)).toEqual(expected);
    });
  });

  describe('formatSchema', () => {
    it('should format all the attributes to an array', () => {
      const schemas = {
        address: {
          apiID: 'address',
          schema: {
            pluginOptions: { i18n: { enabled: false } },
            attributes: {
              name: { type: 'string', pluginOptions: { i18n: { enabled: false } } },
              price: { type: 'integer' },
            },
          },
        },
        test: {
          apiID: 'test',
          schema: {
            pluginOptions: { i18n: { enabled: false } },
            attributes: {
              firstName: { type: 'string', pluginOptions: { i18n: { enabled: false } } },
              lastName: { type: 'string' },
            },
          },
        },
      };

      const expected = {
        address: {
          apiID: 'address',
          schema: {
            pluginOptions: { i18n: { enabled: false } },
            attributes: [
              { type: 'string', pluginOptions: { i18n: { enabled: false } }, name: 'name' },
              { type: 'integer', name: 'price' },
            ],
          },
        },
        test: {
          apiID: 'test',
          schema: {
            pluginOptions: { i18n: { enabled: false } },
            attributes: [
              { type: 'string', pluginOptions: { i18n: { enabled: false } }, name: 'firstName' },
              { type: 'string', name: 'lastName' },
            ],
          },
        },
      };

      expect(formatSchemas(schemas)).toEqual(expected);
    });
  });
});
