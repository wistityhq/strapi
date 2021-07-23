'use strict';

const { diffSchemas } = require('../schema-diff');

describe('diffSchemas', () => {
  test('New Table', () => {
    const testTable = {
      name: 'my_table',
    };

    const srcSchema = {
      tables: [],
    };

    const destSchema = {
      tables: [testTable],
    };

    expect(diffSchemas(srcSchema, destSchema)).toStrictEqual({
      status: 'CHANGED',
      diff: {
        tables: {
          added: [testTable],
          updated: [],
          unchanged: [],
          removed: [],
        },
      },
    });
  });

  test('Removed Table', () => {
    const testTable = {
      name: 'my_table',
    };

    const srcSchema = {
      tables: [testTable],
    };

    const destSchema = {
      tables: [],
    };

    expect(diffSchemas(srcSchema, destSchema)).toStrictEqual({
      status: 'CHANGED',
      diff: {
        tables: {
          added: [],
          updated: [],
          unchanged: [],
          removed: [testTable],
        },
      },
    });
  });

  test('Unchanged Table', () => {
    const testTable = {
      name: 'my_table',
      columns: [],
      indexes: [],
      foreignKeys: [],
    };

    const srcSchema = {
      tables: [testTable],
    };

    const destSchema = {
      tables: [testTable],
    };

    expect(diffSchemas(srcSchema, destSchema)).toStrictEqual({
      status: 'UNCHANGED',
      diff: {
        tables: {
          added: [],
          updated: [],
          unchanged: [testTable],
          removed: [],
        },
      },
    });
  });

  describe('Changed table', () => {
    test('added column', () => {
      const srcSchema = {
        tables: [
          {
            name: 'my_table',
            columns: [],
            indexes: [],
            foreignKeys: [],
          },
        ],
      };

      const destSchema = {
        tables: [
          {
            name: 'my_table',
            indexes: [],
            foreignKeys: [],
            columns: [
              {
                name: 'test_column',
              },
            ],
          },
        ],
      };

      expect(diffSchemas(srcSchema, destSchema)).toStrictEqual({
        status: 'CHANGED',
        diff: {
          tables: {
            added: [],
            updated: [
              {
                name: 'my_table',
                columns: {
                  added: [
                    {
                      name: 'test_column',
                    },
                  ],
                  updated: [],
                  unchanged: [],
                  removed: [],
                },
                foreignKeys: {
                  added: [],
                  updated: [],
                  unchanged: [],
                  removed: [],
                },
                indexes: {
                  added: [],
                  updated: [],
                  unchanged: [],
                  removed: [],
                },
              },
            ],
            unchanged: [],
            removed: [],
          },
        },
      });
    });

    test.todo('updated column');
    test.todo('unchanged column');
    test.todo('removed column');

    test.todo('added index');
    test.todo('updated index');
    test.todo('unchanged index');
    test.todo('removed index');

    test.todo('added foreign key');
    test.todo('updated foreign key');
    test.todo('unchanged foreign key');
    test.todo('removed foreign key');
  });
});
