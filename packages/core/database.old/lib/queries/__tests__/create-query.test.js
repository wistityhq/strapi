'use strict';

const _ = require('lodash');
const createQuery = require('../create-query');

describe('Database queries', () => {
  global.strapi = {
    db: {
      lifecycles: {
        run() {},
      },
    },
  };

  describe('Substitute id with primaryKey in parameters', () => {
    test.each(['create', 'update', 'delete', 'find', 'findOne', 'search', 'count', 'countSearch'])(
      'Calling "%s" replaces id by the primaryKey in the params of the model before calling the underlying connector',
      async method => {
        const model = {
          primaryKey: 'testId',
        };
        const params = {
          id: 'someValue',
        };

        const connectorQuery = {
          [method]: jest.fn(() => Promise.resolve({})),
        };

        const query = createQuery({ model, connectorQuery });

        await query[method](params);

        expect(connectorQuery[method]).toHaveBeenCalledWith({
          testId: 'someValue',
        });
      }
    );
  });

  describe('Lifecycles', () => {
    test.each(['create', 'update', 'delete', 'find', 'findOne', 'search', 'count', 'countSearch'])(
      'Calling "%s" calls the before adn after lifecycle hooks with the correct arguments',
      async method => {
        const arg1 = {};
        const arg2 = {};
        const output = {};
        const beforeLifecycleMethod = jest.fn();
        const afterLifecycleMethod = jest.fn();
        const queryMethod = jest.fn(() => Promise.resolve(output));

        const model = {
          lifecycles: {
            [`before${_.upperFirst(method)}`]: beforeLifecycleMethod,
            [`after${_.upperFirst(method)}`]: afterLifecycleMethod,
          },
        };

        const connectorQuery = {
          [method]: queryMethod,
        };

        const query = createQuery({ model, connectorQuery });

        await query[method](arg1, arg2);

        expect(queryMethod).toHaveBeenCalledWith(arg1, arg2);
        expect(beforeLifecycleMethod).toHaveBeenCalledWith(arg1, arg2);
        expect(afterLifecycleMethod).toHaveBeenCalledWith(output, arg1, arg2);
      }
    );
  });
});
