'use strict';

const { buildMutation, buildQuery } = require('../old/resolvers-builder');

global.strapi = {
  plugins: {
    graphql: {
      config: {},
    },
  },
  api: {
    'my-api': {
      controllers: {
        'my-controller': {},
      },
    },
  },
};

const graphqlContext = {
  context: {
    req: {},
    res: {},
    app: {
      createContext(request, response) {
        return { request, response };
      },
    },
  },
};

describe('Resolvers builder', () => {
  describe('buildMutation', () => {
    test("Returns ctx.body if it's not falsy and the resolver is a string", async () => {
      expect.assertions(1);

      strapi.api['my-api'].controllers['my-controller'].myAction = async ctx => {
        ctx.body = 1;
      };

      const resolver = buildMutation('mutation', {
        resolver: 'application::my-api.my-controller.myAction',
      });

      const result = await resolver(null, {}, graphqlContext);
      expect(result).toBe(1);
    });

    test("Returns ctx.body if it's not undefined and the resolver is a string", async () => {
      expect.assertions(1);

      strapi.api['my-api'].controllers['my-controller'].myAction = async ctx => {
        ctx.body = 0;
      };

      const resolver = buildMutation('mutation', {
        resolver: 'application::my-api.my-controller.myAction',
      });

      const result = await resolver(null, {}, graphqlContext);
      expect(result).toBe(0);
    });

    test('Returns the action result if ctx.body is undefined and the resolver is a string', async () => {
      expect.assertions(1);

      strapi.api['my-api'].controllers['my-controller'].myAction = async () => 'result';

      const resolver = buildMutation('mutation', {
        resolver: 'application::my-api.my-controller.myAction',
      });

      const result = await resolver(null, {}, graphqlContext);
      expect(result).toBe('result');
    });
  });

  describe('buildQuery', () => {
    test("Returns ctx.body if it's not falsy and the resolver is a string", async () => {
      expect.assertions(1);

      strapi.api['my-api'].controllers['my-controller'].myAction = async ctx => {
        ctx.body = 1;
      };

      const resolver = buildQuery('mutation', {
        resolver: 'application::my-api.my-controller.myAction',
      });

      const result = await resolver(null, {}, graphqlContext);
      expect(result).toBe(1);
    });

    test("Returns ctx.body if it's not undefined and the resolver is a string", async () => {
      expect.assertions(1);

      strapi.api['my-api'].controllers['my-controller'].myAction = async ctx => {
        ctx.body = 0;
      };

      const resolver = buildQuery('mutation', {
        resolver: 'application::my-api.my-controller.myAction',
      });

      const result = await resolver(null, {}, graphqlContext);
      expect(result).toBe(0);
    });

    test('Returns the action result if ctx.body is undefined and the resolver is a string', async () => {
      expect.assertions(1);

      strapi.api['my-api'].controllers['my-controller'].myAction = async () => 'result';

      const resolver = buildQuery('mutation', {
        resolver: 'application::my-api.my-controller.myAction',
      });

      const result = await resolver(null, {}, graphqlContext);
      expect(result).toBe('result');
    });
  });
});
