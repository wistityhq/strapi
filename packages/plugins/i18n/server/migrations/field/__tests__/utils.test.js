'use strict';

const { shouldBeProcessed, getUpdatesInfo } = require('../utils');

describe('i18n - migration utils', () => {
  describe('shouldBeProcessed', () => {
    const testData = [
      [[], [], false],
      [['en'], [], false],
      [['en', 'fr'], [], false],
      [['en', 'fr'], [{ locale: 'en' }], false],
      [['en', 'fr'], [{ locale: 'fr' }], false],
      [['en'], [{ locale: 'fr' }, { locale: 'en' }], false],
      [['en', 'fr'], [{ locale: 'fr' }, { locale: 'en' }], false],
      [[], [{ locale: 'en' }], true],
      [['en'], [{ locale: 'fr' }], true],
      [['en', 'fr'], [{ locale: 'it' }], true],
    ];

    test.each(testData)('%p %j : %p', (processedLocaleCodes, localizations, expectedResult) => {
      const result = shouldBeProcessed(processedLocaleCodes)({ localizations });

      expect(result).toBe(expectedResult);
    });
  });

  describe('getUpdatesInfo', () => {
    const testData = [
      [
        [{ name: 'Name', nickname: 'Nickname', localizations: [{ id: 1 }, { id: 2 }] }],
        ['name'],
        [{ entriesIdsToUpdate: [1, 2], attributesValues: { name: 'Name' } }],
      ],
      [
        [
          { name: 'Name 1', nickname: 'Nickname 1', localizations: [{ id: 1 }, { id: 2 }] },
          { name: 'Name 2', nickname: 'Nickname 2', localizations: [{ id: 3 }, { id: 4 }] },
        ],
        ['name'],
        [
          { entriesIdsToUpdate: [1, 2], attributesValues: { name: 'Name 1' } },
          { entriesIdsToUpdate: [3, 4], attributesValues: { name: 'Name 2' } },
        ],
      ],
    ];

    test.each(testData)('%j', (entriesToProcess, attributesToMigrate, expectedResult) => {
      const result = getUpdatesInfo({ entriesToProcess, attributesToMigrate });

      expect(result).toEqual(expectedResult);
    });
  });
});
