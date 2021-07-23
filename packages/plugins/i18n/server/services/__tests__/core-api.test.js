'use strict';
const { createSanitizer } = require('../core-api');

describe('Core API', () => {
  describe('sanitizer', () => {
    test('sanitizeInput keeps only writable fields', () => {
      const contentType = {
        attributes: {
          title: {
            type: 'string',
          },
          nonWritables: {
            type: 'string',
            writable: false,
          },
        },
      };

      const { sanitizeInput } = createSanitizer(contentType);

      const input = {
        title: 'test',
        nonWritables: 'test',
      };

      const output = sanitizeInput(input);

      expect(output).toStrictEqual({
        title: 'test',
      });
    });

    test('sanitizeInput excludes locale & localizations', () => {
      const contentType = {
        attributes: {
          title: {
            type: 'string',
          },
          nonWritables: {
            type: 'string',
            writable: false,
          },
          locale: {
            type: 'string',
            writable: true,
          },
          localizations: {
            type: 'string',
            writable: true,
          },
        },
      };

      const { sanitizeInput } = createSanitizer(contentType);

      const input = {
        title: 'test',
        nonWritables: 'test',
        locale: 'FR',
        localizations: [1, 2],
      };

      const output = sanitizeInput(input);

      expect(output).toStrictEqual({
        title: 'test',
      });
    });

    test('sanitizeInputFiles keeps only writable fields', () => {
      const contentType = {
        attributes: {
          title: {
            type: 'string',
          },
          nonWritableCompo: {
            type: 'component',
            writable: false,
          },
          writableCompo: {
            type: 'component',
            writable: true,
          },
          image: {
            model: 'file',
            plugin: 'upload',
            writable: false,
          },
        },
      };

      const { sanitizeInputFiles } = createSanitizer(contentType);

      const input = {
        'writableCompo.image': {},
        'nonWritableCompo.image': {},
      };

      const output = sanitizeInputFiles(input);

      expect(output).toStrictEqual({
        'writableCompo.image': {},
      });
    });
  });
});
