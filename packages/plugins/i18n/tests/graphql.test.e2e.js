'use strict';

// Helpers.
const { createTestBuilder } = require('../../../../test/helpers/builder');
const { createStrapiInstance } = require('../../../../test/helpers/strapi');
const { createAuthRequest } = require('../../../../test/helpers/request');

const builder = createTestBuilder();
let strapi;
let rq;
let graphqlQuery;
let localeId;

const recipesModel = {
  attributes: {
    name: {
      type: 'string',
    },
  },
  pluginOptions: {
    i18n: {
      localized: true,
    },
  },
  name: 'recipes',
  description: '',
  collectionName: '',
};

describe('Test Graphql API create localization', () => {
  beforeAll(async () => {
    await builder.addContentType(recipesModel).build();

    strapi = await createStrapiInstance();
    rq = await createAuthRequest({ strapi });

    graphqlQuery = body => {
      return rq({
        url: '/graphql',
        method: 'POST',
        body,
      });
    };

    const locale = await strapi.query('plugins::i18n.locale').create({
      data: { code: 'fr', name: 'French' },
    });

    localeId = locale.id;
  });

  afterAll(async () => {
    await strapi.query('plugins::i18n.locale').delete({ where: { id: localeId } });
    await strapi.query('application::recipes.recipes').deleteMany();
    await strapi.destroy();
    await builder.cleanup();
  });

  test('Create localization for a model with plural name', async () => {
    const createResponse = await graphqlQuery({
      query: /* GraphQL */ `
        mutation createRecipe($input: createRecipeInput) {
          createRecipe(input: $input) {
            recipe {
              id
              name
              locale
            }
          }
        }
      `,
      variables: {
        input: {
          data: {
            name: 'Recipe Name',
          },
        },
      },
    });

    expect(createResponse.statusCode).toBe(200);
    expect(createResponse.body.data.createRecipe.recipe).toMatchObject({
      name: 'Recipe Name',
      locale: 'en',
    });

    const recipeId = createResponse.body.data.createRecipe.recipe.id;

    const createLocalizationResponse = await graphqlQuery({
      query: /* GraphQL */ `
        mutation createRecipeLocalization($input: updateRecipeInput!) {
          createRecipeLocalization(input: $input) {
            id
            name
            locale
          }
        }
      `,
      variables: {
        input: {
          where: {
            id: recipeId,
          },
          data: {
            name: 'Recipe Name fr',
            locale: 'fr',
          },
        },
      },
    });

    expect(createLocalizationResponse.statusCode).toBe(200);
    expect(createLocalizationResponse.body.data.createRecipeLocalization).toMatchObject({
      name: 'Recipe Name fr',
      locale: 'fr',
    });
  });
});
