'use strict';

const types = require('../services/old/type-builder');
const buildShadowCrud = require('../services/old/shadow-crud');

const playerModel = {
  attributes: {
    lastname: {
      type: 'text',
    },
    firstname: {
      type: 'text',
    },
    age: {
      type: 'integer',
    },
    level: {
      type: 'enumeration',
      enum: ['amateur', 'intermediary', 'pro'],
      default: 'amateur',
    },
  },
  connection: 'default',
  name: 'player',
  description: '',
  collectionName: '',
  globalId: 'Player',
  kind: 'collectionType',
  modelName: 'player',
};

describe('generateInputModel', () => {
  test('removes disabled attributes', () => {
    global.strapi = {
      plugins: {
        graphql: {
          config: {
            _schema: {
              graphql: {
                type: {
                  Player: {
                    age: false,
                    level: false,
                  },
                },
              },
            },
          },
        },
      },
    };
    expect(types.generateInputModel(playerModel, 'player')).toEqual(
      `
      input PlayerInput {

        lastname: String
firstname: String
      }

      input editPlayerInput {
        
        lastname: String
firstname: String
      }
    `
    );
  });
});

describe('buildShadowCrud', () => {
  test('removes disabled attributes', () => {
    global.strapi = {
      plugins: {
        graphql: {
          config: {
            _schema: {
              graphql: {
                type: {
                  Player: {
                    age: false,
                    level: false,
                  },
                },
              },
            },
          },
        },
      },
    };
    global.strapi.contentTypes = [playerModel];
    global.strapi.components = {};
    expect(JSON.stringify(buildShadowCrud({}))).toEqual(
      '{"definition":"\\ntype Player {id: ID!\\nundefined: ID!\\nlastname: String\\nfirstname: String}\\n\\n      input PlayerInput {\\n\\n        lastname: String\\nfirstname: String\\n      }\\n\\n      input editPlayerInput {\\n        \\n        lastname: String\\nfirstname: String\\n      }\\n    ","query":{},"mutation":{},"resolvers":{"Query":{},"Mutation":{},"Player":{}}}'
    );
  });
});
