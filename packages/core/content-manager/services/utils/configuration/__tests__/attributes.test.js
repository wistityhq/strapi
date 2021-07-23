'use strict';

const { isSortable, isVisible } = require('../attributes');

const createMockSchema = (attrs, timestamps = true) => {
  return {
    options: {
      timestamps: timestamps ? ['createdAt', 'updatedAt'] : false,
    },
    attributes: {
      id: {
        type: 'integer',
      },
      ...attrs,
      ...(timestamps
        ? {
            createdAt: {
              type: 'timestamp',
            },
            updatedAt: {
              type: 'timestamp',
            },
          }
        : {}),
    },
  };
};

describe('attributesUtils', () => {
  describe('isSortable', () => {
    test('The id attribute is always sortable', () => {
      expect(isSortable(createMockSchema({}), 'id')).toBe(true);
    });

    test('Timestamps are sortable', () => {
      expect(isSortable(createMockSchema({}, true), 'createdAt')).toBe(true);
      expect(isSortable(createMockSchema({}, true), 'updatedAt')).toBe(true);
      expect(isSortable(createMockSchema({}, false), 'createdAt')).toBe(false);
    });

    test('Component fields are not sortable', () => {
      const schema = createMockSchema({
        someComponent: {
          type: 'component',
        },
      });

      expect(isSortable(schema, 'someComponent')).toBe(false);
    });

    test('Json fields are not sortable', () => {
      const schema = createMockSchema({
        jsonInput: {
          type: 'json',
        },
      });

      expect(isSortable(schema, 'jsonInput')).toBe(false);
    });

    test('x-to-one relations only are sortable', () => {
      const schema = createMockSchema({
        oneWayRel: {
          type: 'relation',
          targetModel: 'someModel',
          relationType: 'oneToOne',
        },
        manyToOneRel: {
          type: 'relation',
          targetModel: 'someModel',
          relationType: 'manyToOne',
        },
        oneToOneRel: {
          type: 'relation',
          targetModel: 'someModel',
          relationType: 'oneToOne',
        },
        manyWayRel: {
          type: 'relation',
          targetModel: 'someModel',
          relationType: 'oneToMany',
        },
        oneToManyRel: {
          type: 'relation',
          targetModel: 'someModel',
          relationType: 'oneToMany',
        },
        manyToManyRel: {
          type: 'relation',
          targetModel: 'someModel',
          relationType: 'manyToMany',
        },
        manyToManyMorphRel: {
          type: 'relation',
          targetModel: 'someModel',
          relationType: 'manyToManyMorph',
        },
        manyToOneMorphRel: {
          type: 'relation',
          targetModel: 'someModel',
          relationType: 'manyToOneMorph',
        },
        oneToManyMorphRel: {
          type: 'relation',
          targetModel: 'someModel',
          relationType: 'oneToManyMorph',
        },
        oneToOneMorphRel: {
          type: 'relation',
          targetModel: 'someModel',
          relationType: 'oneToOneMorph',
        },
        oneMorphToOneRel: {
          type: 'relation',
          targetModel: 'someModel',
          relationType: 'oneMorphToOne',
        },
        manyMorphToOneRel: {
          type: 'relation',
          targetModel: 'someModel',
          relationType: 'manyMorphToOne',
        },
        manyMorphToManyRel: {
          type: 'relation',
          targetModel: 'someModel',
          relationType: 'manyMorphToMany',
        },
      });

      expect(isSortable(schema, 'oneWayRel')).toBe(true);
      expect(isSortable(schema, 'manyToOneRel')).toBe(true);
      expect(isSortable(schema, 'oneToOneRel')).toBe(true);

      expect(isSortable(schema, 'manyWayRel')).toBe(false);
      expect(isSortable(schema, 'oneToManyRel')).toBe(false);
      expect(isSortable(schema, 'manyToManyRel')).toBe(false);
      expect(isSortable(schema, 'manyToManyMorphRel')).toBe(false);
      expect(isSortable(schema, 'manyToOneMorphRel')).toBe(false);
      expect(isSortable(schema, 'oneToManyMorphRel')).toBe(false);
      expect(isSortable(schema, 'oneToOneMorphRel')).toBe(false);
      expect(isSortable(schema, 'oneMorphToOneRel')).toBe(false);
      expect(isSortable(schema, 'manyMorphToOneRel')).toBe(false);
      expect(isSortable(schema, 'manyMorphToManyRel')).toBe(false);
    });
  });

  describe('isVisible', () => {
    test('Check if the attribute is in a model attributes', () => {
      expect(
        isVisible(
          createMockSchema({
            field: {
              type: 'string',
            },
          }),
          'field'
        )
      ).toBe(true);

      expect(isVisible(createMockSchema({}), 'createdAt')).toBe(false);
    });
  });
});
