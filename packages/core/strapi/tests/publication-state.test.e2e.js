'use strict';

const { createStrapiInstance } = require('../../../../test/helpers/strapi');
const { createAuthRequest } = require('../../../../test/helpers/request');
const { createTestBuilder } = require('../../../../test/helpers/builder');

const builder = createTestBuilder();
let strapi;
let rq;

const fixtures = {
  product: [
    {
      name: 'Bamboo Desk',
      categories: ['Home'],
      comp: { countries: ['France'] },
      published_at: null,
    },
    {
      name: 'Computer',
      categories: ['Home', 'Tech'],
      comp: { countries: ['France', 'Italy', 'Spain'] },
      published_at: new Date(),
    },
    {
      name: 'Burger Drone',
      categories: ['Tech', 'Food'],
      comp: { countries: ['Italy', 'Spain'] },
      published_at: new Date(),
    },
  ],
  category: [
    { name: 'Home', published_at: null },
    { name: 'Food', published_at: new Date() },
    { name: 'Tech', published_at: new Date() },
  ],
  country: [
    { name: 'France', published_at: new Date() },
    { name: 'Italy', published_at: null },
    { name: 'Spain', published_at: new Date() },
  ],
};

const data = { product: [], category: [], country: [] };

const pluralizedModels = {
  product: 'products',
  country: 'countries',
  category: 'categories',
};

const contentTypes = {
  product: {
    attributes: {
      name: {
        type: 'string',
      },
      categories: {
        type: 'relation',
        relation: 'oneToMany',
        target: 'application::category.category',
      },
      comp: {
        component: 'default.comp',
        type: 'component',
        required: true,
      },
    },
    draftAndPublish: true,
    name: 'product',
    description: '',
    collectionName: '',
  },
  country: {
    attributes: {
      name: {
        type: 'string',
      },
    },
    draftAndPublish: true,
    name: 'country',
    description: '',
    collectionName: '',
  },
  category: {
    attributes: {
      name: {
        type: 'string',
      },
    },
    draftAndPublish: true,
    name: 'category',
    description: '',
    collectionName: '',
  },
};

const components = {
  comp: {
    name: 'comp',
    attributes: {
      countries: {
        type: 'relation',
        relation: 'oneToMany',
        target: 'application::country.country',
      },
    },
  },
};

const filterBy = (name, { mode = 'live' } = {}) => {
  return fixtures[name].filter(item => {
    if (['live', 'default'].includes(mode)) {
      return item.published_at instanceof Date;
    }
    return true;
  });
};

const lengthFor = (name, { mode = 'live' } = {}) => {
  return filterBy(name, { mode }).length;
};

const getQueryFromMode = mode => {
  if (['live', 'preview'].includes(mode)) {
    return `?publicationState=${mode}`;
  }

  return '';
};

describe('Publication State', () => {
  beforeAll(async () => {
    await builder
      .addContentType(contentTypes.country)
      .addComponent(components.comp)
      .addContentTypes([contentTypes.category, contentTypes.product])
      .addFixtures(contentTypes.country.name, fixtures.country)
      .addFixtures(contentTypes.category.name, fixtures.category)
      .addFixtures(contentTypes.product.name, f =>
        fixtures.product.map(product => ({
          name: product.name,
          categories: product.categories.map(name => f.category.find(cat => cat.name === name).id),
          comp: {
            countries: product.comp.countries.map(
              name => f.country.find(country => country.name === name).id
            ),
          },
          published_at: product.published_at,
        }))
      )
      .build();

    strapi = await createStrapiInstance();
    rq = await createAuthRequest({ strapi });

    Object.assign(data, builder.sanitizedFixtures(strapi));
  });

  afterAll(async () => {
    await strapi.destroy();
    await builder.cleanup();
  });

  describe.each(['default', 'live', 'preview'])('Mode: "%s"', mode => {
    describe.each(['country', 'category', 'product'])('For %s', modelName => {
      const baseUrl = `/${pluralizedModels[modelName]}`;
      const query = getQueryFromMode(mode);

      test('Can get entries', async () => {
        const res = await rq({ method: 'GET', url: `${baseUrl}${query}` });

        expect(res.body).toHaveLength(lengthFor(modelName, { mode }));
      });

      test('Can count entries', async () => {
        const res = await rq({ method: 'GET', url: `${baseUrl}/count${query}` });

        expect(res.body).toBe(lengthFor(modelName, { mode }));
      });
    });
  });

  describe('Advanced checks', () => {
    describe('Nested level of relations (live mode)', () => {
      let products;
      const pluralizedModelName = pluralizedModels[contentTypes.product.name];

      beforeEach(async () => {
        const res = await rq({
          method: 'GET',
          url: `/${pluralizedModelName}?publicationState=live`,
          qs: {
            populate: ['categories', 'comp.countries'],
          },
        });
        products = res.body;
      });

      const getApiRef = id => data.product.find(product => product.id === id);

      test('Payload integrity', () => {
        expect(products).toHaveLength(lengthFor(contentTypes.product.name));
      });

      test('Root level', () => {
        products.forEach(product => {
          expect(product.published_at).toBeISODate();
        });
      });

      test('First level (categories)', () => {
        products.forEach(({ id, categories }) => {
          const length = getApiRef(id).categories.filter(c => c.published_at !== null).length;
          expect(categories).toHaveLength(length);

          categories.forEach(category => {
            expect(category.published_at).toBeISODate();
          });
        });
      });

      test('Second level through component (countries)', () => {
        products.forEach(({ id, comp: { countries } }) => {
          const length = getApiRef(id).comp.countries.filter(c => c.published_at !== null).length;
          expect(countries).toHaveLength(length);

          countries.forEach(country => {
            expect(country.published_at).toBeISODate();
          });
        });
      });
    });
  });
});
