'use strict';

const getTypeValidator = require('../types');

describe('Type validators', () => {
  describe.each(['collectionType', 'singleType'])('mixed type', kind => {
    test('pluginOptions can be used', () => {
      const attributes = {
        title: {
          type: 'string',
          pluginOptions: {
            i18n: {
              localized: false,
            },
          },
        },
      };

      const validator = getTypeValidator(attributes.title, {
        types: ['string'],
        modelType: kind,
        attributes,
      });

      expect(validator.isValidSync(attributes.title)).toBe(true);
    });

    test('can use custom keys', () => {
      const attributes = {
        title: {
          type: 'string',
          myCustomKey: true,
        },
      };

      const validator = getTypeValidator(attributes.title, {
        types: ['string'],
        modelType: kind,
        attributes,
      });

      expect(validator.isValidSync(attributes.title)).toBe(true);
    });
  });

  describe('UID type validator', () => {
    test('Target field can be null', () => {
      const attributes = {
        slug: {
          type: 'uid',
        },
      };

      const validator = getTypeValidator(attributes.slug, {
        types: ['uid'],
        modelType: 'collectionType',
        attributes,
      });

      expect(validator.isValidSync(attributes.slug)).toBe(true);
    });

    test('Target field must point to an existing field', () => {
      const attributes = {
        slug: {
          type: 'uid',
          targetField: 'unknown',
        },
      };

      const validator = getTypeValidator(attributes.slug, {
        types: ['uid'],
        modelType: 'collectionType',
        attributes,
      });

      expect(validator.isValidSync(attributes.slug)).toBe(false);
    });

    test('Target field can be a string', () => {
      const attributes = {
        title: {
          type: 'string',
        },
        slug: {
          type: 'uid',
          targetField: 'title',
        },
      };

      const validator = getTypeValidator(attributes.slug, {
        types: ['uid'],
        modelType: 'collectionType',
        attributes,
      });

      expect(validator.isValidSync(attributes.slug)).toBe(true);
    });

    test('Target field can be a text', () => {
      const attributes = {
        title: {
          type: 'text',
        },
        slug: {
          type: 'uid',
          targetField: 'title',
        },
      };

      const validator = getTypeValidator(attributes.slug, {
        types: ['uid'],
        modelType: 'collectionType',
        attributes,
      });

      expect(validator.isValidSync(attributes.slug)).toBe(true);
    });

    test('Target field must have a type', () => {
      const attributes = {
        relation: {
          type: 'relation',
          relation: 'oneToOne',
        },
        slug: {
          type: 'uid',
          targetField: 'relation',
        },
      };

      const validator = getTypeValidator(attributes.slug, {
        types: ['uid'],
        modelType: 'collectionType',
        attributes,
      });

      expect(validator.isValidSync(attributes.slug)).toBe(false);
    });

    test.each([
      'media',
      'richtext',
      'json',
      'enumeration',
      'password',
      'email',
      'integer',
      'biginteger',
      'float',
      'decimal',
      'date',
      'time',
      'datetime',
      'timestamp',
      'boolean',
    ])('Target field cannot be %s', type => {
      const attributes = {
        title: {
          type,
        },
        slug: {
          type: 'uid',
          targetField: 'title',
        },
      };

      const validator = getTypeValidator(attributes.slug, {
        types: ['uid'],
        modelType: 'collectionType',
        attributes,
      });

      expect(validator.isValidSync(attributes.slug)).toBe(false);
    });

    test.each([
      ['basic-uid-value1911', true],
      ['uid_with_underscore', true],
      ['tilde~_isAllowed', true],
      ['dots.are.allowed', true],
      ['no-accentsé', false],
      ['no-special$-chars&@', false],
      ['some-invalid&é&e-uid', false],
      ['some/azdazd/', false],
      ['some(azdazd)', false],
      ['some=azdazd', false],
      ['some?azdazd=azdaz', false],
    ])('Default value must match regex %s => %s', (value, isValid) => {
      const attributes = {
        slug: {
          type: 'uid',
          default: value,
        },
      };

      const validator = getTypeValidator(attributes.slug, {
        types: ['uid'],
        modelType: 'collectionType',
        attributes,
      });

      expect(validator.isValidSync(attributes.slug)).toBe(isValid);
    });

    test('Default should not be defined if targetField is defined', () => {
      const attributes = {
        title: {
          type: 'string',
        },
        slug: {
          type: 'uid',
          targetField: 'title',
          default: 'some-value',
        },
      };

      const validator = getTypeValidator(attributes.slug, {
        types: ['uid'],
        modelType: 'collectionType',
        attributes,
      });

      expect(() => validator.validateSync(attributes.slug)).toThrow(
        'cannot define a default UID if the targetField is set'
      );
    });

    test('maxLength cannot be smaller then minLength', () => {
      const attributes = {
        slug: {
          type: 'uid',
          minLength: 120,
          maxLength: 119,
        },
      };

      const validator = getTypeValidator(attributes.slug, {
        types: ['uid'],
        modelType: 'collectionType',
        attributes,
      });

      expect(() => validator.validateSync(attributes.slug)).toThrow(
        'maxLength must be greater or equal to minLength'
      );
    });

    test('maxLength can be equal to minLength', () => {
      const attributes = {
        slug: {
          type: 'uid',
          minLength: 120,
          maxLength: 120,
        },
      };

      const validator = getTypeValidator(attributes.slug, {
        types: ['uid'],
        modelType: 'collectionType',
        attributes,
      });

      expect(validator.isValidSync(attributes.slug)).toBe(true);
    });

    test('maxLength cannot be over 256', () => {
      const attributes = {
        slug: {
          type: 'uid',
          maxLength: 257,
        },
      };

      const validator = getTypeValidator(attributes.slug, {
        types: ['uid'],
        modelType: 'collectionType',
        attributes,
      });

      expect(validator.isValidSync(attributes.slug)).toBe(false);
    });
  });

  describe('media type', () => {
    test('Validates allowedTypes', () => {
      const attributes = {
        img: {
          type: 'media',
          allowedTypes: ['nonexistent'],
        },
      };

      const validator = getTypeValidator(attributes.img, {
        types: ['media'],
        modelType: 'collectionType',
        attributes,
      });

      expect(validator.isValidSync(attributes.img)).toBe(false);
    });

    test('Cannot set all with other allowedTypes', () => {
      const attributes = {
        img: {
          type: 'media',
          allowedTypes: ['all', 'videos'],
        },
      };

      const validator = getTypeValidator(attributes.img, {
        types: ['media'],
        modelType: 'collectionType',
        attributes,
      });

      expect(validator.isValidSync(attributes.img)).toBe(false);
    });

    test('Can set multiple allowedTypes', () => {
      const attributes = {
        img: {
          type: 'media',
          allowedTypes: ['files', 'videos'],
        },
      };

      const validator = getTypeValidator(attributes.img, {
        types: ['media'],
        modelType: 'collectionType',
        attributes,
      });

      expect(validator.isValidSync(attributes.img)).toBe(true);
    });

    test.each(['images', 'files', 'videos'])('%s is an allowed types', type => {
      const attributes = {
        img: {
          type: 'media',
          allowedTypes: [type],
        },
      };

      const validator = getTypeValidator(attributes.img, {
        types: ['media'],
        modelType: 'collectionType',
        attributes,
      });

      expect(validator.isValidSync(attributes.img)).toBe(true);
    });
  });
});
