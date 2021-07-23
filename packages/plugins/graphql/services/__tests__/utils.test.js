'use strict';

const { mergeSchemas } = require('../old/utils');

const createRootSchema = () => ({
  definition: '',
  resolvers: {},
  query: {},
  mutation: {},
});

describe('Utils', () => {
  describe('mergeSchemas', () => {
    test('Ignore empty schema', () => {
      const rootSchema = createRootSchema();
      mergeSchemas(rootSchema, {});

      expect(rootSchema).toEqual(createRootSchema());
    });

    test('Concatenates definitions', () => {
      const rootSchema = createRootSchema();
      mergeSchemas(rootSchema, {
        definition: 'type Query {}',
      });

      expect(rootSchema).toMatchObject({
        definition: '\ntype Query {}',
      });
    });

    test('merges resolvers', () => {
      const resolvers = {
        Post: {
          id: () => {},
        },
      };

      const rootSchema = createRootSchema();
      mergeSchemas(rootSchema, {
        resolvers,
      });

      expect(rootSchema.resolvers).toEqual(resolvers);
    });

    test('merges query and mutation', () => {
      const query = {
        posts() {},
      };

      const mutation = {
        createMutation() {},
      };

      const rootSchema = createRootSchema();
      mergeSchemas(rootSchema, {
        query,
        mutation,
      });

      expect(rootSchema.query).toEqual(query);
      expect(rootSchema.mutation).toEqual(mutation);
    });
  });
});
