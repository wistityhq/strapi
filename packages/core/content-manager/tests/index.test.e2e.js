'use strict';

// Helpers.
const { createTestBuilder } = require('../../../../test/helpers/builder');
const { createStrapiInstance } = require('../../../../test/helpers/strapi');
const form = require('../../../../test/helpers/generators');
const { createAuthRequest } = require('../../../../test/helpers/request');

const cleanDate = entry => {
  delete entry.updatedAt;
  delete entry.createdAt;
  delete entry.created_at;
  delete entry.updated_at;
};

const builder = createTestBuilder();
let strapi;
let data;
let rq;

const deleteFixtures = async () => {
  for (const [name, modelName] of [
    ['references', 'reference'],
    ['tags', 'tag'],
    ['categories', 'category'],
    ['articles', 'article'],
    ['articlesWithTag', 'articlewithtag'],
  ]) {
    const uid = `application::${modelName}.${modelName}`;

    await rq({
      method: 'POST',
      url: `/content-manager/collection-types/${uid}/actions/bulkDelete`,
      body: {
        ids: (data[name] || []).map(({ id }) => id),
      },
    });
  }
};

describe('Content Manager End to End', () => {
  beforeAll(async () => {
    await builder
      .addContentTypes(
        [form.article, form.tag, form.category, form.reference, form.articlewithtag],
        { batch: true }
      )
      .build();

    strapi = await createStrapiInstance();
    rq = await createAuthRequest({ strapi });
  });

  afterAll(async () => {
    await strapi.destroy();
    await builder.cleanup();
  });

  describe('Content Types api', () => {
    test('Label is pluralized', async () => {
      const res = await rq({
        url: `/content-manager/content-types`,
        method: 'GET',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            info: expect.objectContaining({
              label: 'Articles',
            }),
          }),
          expect.objectContaining({
            info: expect.objectContaining({
              label: 'Tags',
            }),
          }),
          expect.objectContaining({
            info: expect.objectContaining({
              label: 'Categories',
            }),
          }),
        ])
      );
    });
  });

  describe('Test manyToMany relation (article - tag) with Content Manager', () => {
    beforeAll(async () => {
      data = {
        articles: [],
        tags: [],
      };
    });

    afterAll(async () => {
      await deleteFixtures();
    });

    test('Create tag1', async () => {
      let { body } = await rq({
        url: '/content-manager/collection-types/application::tag.tag',
        method: 'POST',
        body: {
          name: 'tag1',
        },
      });

      data.tags.push(body);

      expect(body.id).toBeDefined();
      // expect(Array.isArray(body.articles)).toBeTruthy();
      expect(body.name).toBe('tag1');
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
      expect(body.published_at).toBeUndefined();
    });

    test('Create tag2', async () => {
      let { body } = await rq({
        url: '/content-manager/collection-types/application::tag.tag',
        method: 'POST',
        body: {
          name: 'tag2',
        },
      });

      data.tags.push(body);

      expect(body.id).toBeDefined();
      // expect(Array.isArray(body.articles)).toBeTruthy();
      expect(body.name).toBe('tag2');
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
      expect(body.published_at).toBeUndefined();
    });

    test('Create tag3', async () => {
      let { body } = await rq({
        url: '/content-manager/collection-types/application::tag.tag',
        method: 'POST',
        body: {
          name: 'tag3',
        },
      });

      data.tags.push(body);

      expect(body.id).toBeDefined();
      // expect(Array.isArray(body.articles)).toBeTruthy();
      expect(body.name).toBe('tag3');
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
      expect(body.published_at).toBeUndefined();
    });

    test('Create article1 without relation', async () => {
      const entry = {
        title: 'Article 1',
        content: 'My super content 1',
        date: '2019-08-13T00:00:00.000Z',
      };

      let { body } = await rq({
        url: '/content-manager/collection-types/application::article.article',
        method: 'POST',
        body: entry,
      });

      data.articles.push(body);

      expect(body.id).toBeDefined();
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      // expect(Array.isArray(body.tags)).toBeTruthy();
      // expect(body.tags.length).toBe(0);
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
      expect(body.published_at).toBeUndefined();
    });

    test('Create article2 with tag1', async () => {
      const entry = {
        title: 'Article 2',
        content: 'Content 2',
        tags: [data.tags[0]],
      };

      let { body } = await rq({
        url: '/content-manager/collection-types/application::article.article',
        method: 'POST',
        body: entry,
      });

      data.articles.push(body);

      expect(body.id).toBeDefined();
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      // expect(Array.isArray(body.tags)).toBeTruthy();
      // expect(body.tags.length).toBe(1);
      // expect(body.tags[0].id).toBe(data.tags[0].id);
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
      expect(body.published_at).toBeUndefined();
    });

    test('Update article1 add tag2', async () => {
      const entry = Object.assign({}, data.articles[0], {
        tags: [data.tags[1]],
      });

      cleanDate(entry);

      let { body } = await rq({
        url: `/content-manager/collection-types/application::article.article/${entry.id}`,
        method: 'PUT',
        body: entry,
      });

      data.articles[0] = body;

      expect(body.id).toBeDefined();
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      // expect(Array.isArray(body.tags)).toBeTruthy();
      // expect(body.tags.length).toBe(1);
      // expect(body.tags[0].id).toBe(data.tags[1].id);
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
      expect(body.published_at).toBeUndefined();
    });

    test('Update article1 add tag1 and tag3', async () => {
      const entry = Object.assign({}, data.articles[0]);
      // entry.tags.push(data.tags[0]);
      // entry.tags.push(data.tags[2]);

      cleanDate(entry);

      let { body } = await rq({
        url: `/content-manager/collection-types/application::article.article/${entry.id}`,
        method: 'PUT',
        body: entry,
      });

      data.articles[0] = body;

      expect(body.id).toBeDefined();
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      // expect(Array.isArray(body.tags)).toBeTruthy();
      // expect(body.tags.length).toBe(3);
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
      expect(body.published_at).toBeUndefined();
    });

    test('Update article1 remove one tag', async () => {
      const entry = Object.assign({}, data.articles[0]);
      // entry.tags = entry.tags.slice(1);

      cleanDate(entry);

      let { body } = await rq({
        url: `/content-manager/collection-types/application::article.article/${entry.id}`,
        method: 'PUT',
        body: entry,
      });

      data.articles[0] = body;

      expect(body.id).toBeDefined();
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      // expect(Array.isArray(body.tags)).toBeTruthy();
      // expect(body.tags.length).toBe(2);
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
      expect(body.published_at).toBeUndefined();
    });

    test('Update article1 remove all tag', async () => {
      const entry = Object.assign({}, data.articles[0], {
        tags: [],
      });

      cleanDate(entry);

      let { body } = await rq({
        url: `/content-manager/collection-types/application::article.article/${entry.id}`,
        method: 'PUT',
        body: entry,
      });

      data.articles[0] = body;

      expect(body.id).toBeDefined();
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      // expect(Array.isArray(body.tags)).toBeTruthy();
      // expect(body.tags.length).toBe(0);
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
      expect(body.published_at).toBeUndefined();
    });

    test('Delete all articles should remove the association in each tags related to them', async () => {
      const { body: createdTag } = await rq({
        url: '/content-manager/collection-types/application::tag.tag',
        method: 'POST',
        body: {
          name: 'tag11',
        },
      });

      const { body: article12 } = await rq({
        url: '/content-manager/collection-types/application::article.article',
        method: 'POST',
        body: {
          title: 'article12',
          content: 'Content',
          tags: [createdTag.id],
        },
      });

      const { body: updatedTag } = await rq({
        url: `/content-manager/collection-types/application::tag.tag/${createdTag.id}`,
        method: 'GET',
      });

      const { body: article13 } = await rq({
        url: '/content-manager/collection-types/application::article.article',
        method: 'POST',
        body: {
          title: 'article13',
          content: 'Content',
          tags: [updatedTag.id],
        },
      });

      const articles = [article12, article13];

      // expect(Array.isArray(articles[0].tags)).toBeTruthy();
      // expect(articles[0].tags.length).toBe(1);
      // expect(Array.isArray(articles[1].tags)).toBeTruthy();
      // expect(articles[1].tags.length).toBe(1);

      let { body: foundTag } = await rq({
        url: `/content-manager/collection-types/application::tag.tag/${createdTag.id}`,
        method: 'GET',
      });

      // expect(Array.isArray(foundTag.articles)).toBeTruthy();
      // expect(foundTag.articles.length).toBe(2);

      await rq({
        url: '/content-manager/collection-types/application::article.article/actions/bulkDelete',
        method: 'POST',
        body: {
          ids: articles.map(article => article.id),
        },
      });

      let { body: foundTag2 } = await rq({
        url: `/content-manager/collection-types/application::tag.tag/${createdTag.id}`,
        method: 'GET',
      });

      // expect(Array.isArray(foundTag2.articles)).toBeTruthy();
      // expect(foundTag2.articles.length).toBe(0);
    });
  });

  describe('Test manyWay articlesWithTags and tags', () => {
    beforeAll(() => {
      data = {
        tags: [],
        articlesWithTag: [],
      };
    });

    afterAll(async () => {
      await deleteFixtures();
    });

    test('Creating an article with some many way tags', async () => {
      const { body: createdTag } = await rq({
        url: '/content-manager/collection-types/application::tag.tag',
        method: 'POST',
        body: {
          name: 'tag11',
        },
      });

      data.tags.push(createdTag);

      const entry = {
        tags: [createdTag.id],
      };

      let { body } = await rq({
        url: '/content-manager/collection-types/application::articlewithtag.articlewithtag',
        method: 'POST',
        body: entry,
      });

      data.articlesWithTag.push(body);

      expect(body.id).toBeDefined();
      // expect(Array.isArray(body.tags)).toBeTruthy();
      // expect(body.tags.length).toBe(1);
      // expect(body.tags[0].id).toBe(data.tags[0].id);
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
    });
  });

  describe('Test oneToMany - manyToOne relation (article - category) with Content Manager', () => {
    beforeAll(() => {
      data = {
        articles: [],
        categories: [],
      };
    });

    afterAll(async () => {
      await deleteFixtures();
    });

    test('Create cat1', async () => {
      let { body } = await rq({
        url: '/content-manager/collection-types/application::category.category',
        method: 'POST',
        body: {
          name: 'cat1',
        },
      });

      data.categories.push(body);

      expect(body.id).toBeDefined();
      // expect(Array.isArray(body.articles)).toBeTruthy();
      expect(body.name).toBe('cat1');
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
      expect(body.published_at).toBeUndefined();
    });

    test('Create cat2', async () => {
      let { body } = await rq({
        url: '/content-manager/collection-types/application::category.category',
        method: 'POST',
        body: {
          name: 'cat2',
        },
      });

      data.categories.push(body);

      expect(body.id).toBeDefined();
      // expect(Array.isArray(body.articles)).toBeTruthy();
      expect(body.name).toBe('cat2');
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
      expect(body.published_at).toBeUndefined();
    });

    test('Create article1 with cat1', async () => {
      const entry = {
        title: 'Article 1',
        content: 'Content 1',
        category: data.categories[0],
      };

      let { body } = await rq({
        url: '/content-manager/collection-types/application::article.article',
        method: 'POST',
        body: entry,
      });

      data.articles.push(body);

      expect(body.id).toBeDefined();
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      // expect(body.category.name).toBe(entry.category.name);
      // expect(Array.isArray(body.tags)).toBeTruthy();
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
    });

    test('Update article1 with cat2', async () => {
      const entry = Object.assign({}, data.articles[0], {
        category: data.categories[1],
      });

      cleanDate(entry);

      let { body } = await rq({
        url: `/content-manager/collection-types/application::article.article/${entry.id}`,
        method: 'PUT',
        body: entry,
      });

      data.articles[0] = body;

      expect(body.id).toBeDefined();
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      // expect(body.category.name).toBe(entry.category.name);
      // expect(Array.isArray(body.tags)).toBeTruthy();
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
    });

    test('Create article2', async () => {
      const entry = {
        title: 'Article 2',
        content: 'Content 2',
      };

      let { body } = await rq({
        url: '/content-manager/collection-types/application::article.article',
        method: 'POST',
        body: entry,
      });

      data.articles.push(body);

      expect(body.id).toBeDefined();
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      // expect(Array.isArray(body.tags)).toBeTruthy();
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
    });

    test('Update article2 with cat2', async () => {
      const entry = Object.assign({}, data.articles[1], {
        category: data.categories[1],
      });

      cleanDate(entry);

      let { body } = await rq({
        url: `/content-manager/collection-types/application::article.article/${entry.id}`,
        method: 'PUT',
        body: entry,
      });

      data.articles[1] = body;

      expect(body.id).toBeDefined();
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      // expect(body.category.name).toBe(entry.category.name);
      // expect(Array.isArray(body.tags)).toBeTruthy();
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
    });

    test('Update cat1 with article1', async () => {
      const entry = Object.assign({}, data.categories[0]);
      // entry.articles.push(data.articles[0]);

      cleanDate(entry);

      let { body } = await rq({
        url: `/content-manager/collection-types/application::category.category/${entry.id}`,
        method: 'PUT',
        body: entry,
      });

      data.categories[0] = body;

      expect(body.id).toBeDefined();
      // expect(Array.isArray(body.articles)).toBeTruthy();
      // expect(body.articles.length).toBe(1);
      expect(body.name).toBe(entry.name);
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
    });

    test('Create cat3 with article1', async () => {
      const entry = {
        name: 'cat3',
        articles: [data.articles[0]],
      };

      let { body } = await rq({
        url: '/content-manager/collection-types/application::category.category',
        method: 'POST',
        body: entry,
      });

      data.categories.push(body);

      expect(body.id).toBeDefined();
      // expect(Array.isArray(body.articles)).toBeTruthy();
      // expect(body.articles.length).toBe(1);
      expect(body.name).toBe(entry.name);
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
    });

    test('Get article1 with cat3', async () => {
      let { body } = await rq({
        url: `/content-manager/collection-types/application::article.article/${data.articles[0].id}`,
        method: 'GET',
      });

      expect(body.id).toBeDefined();
      // expect(body.category.id).toBe(data.categories[2].id);
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
    });

    test('Get article2 with cat2', async () => {
      let { body } = await rq({
        url: `/content-manager/collection-types/application::article.article/${data.articles[1].id}`,
        method: 'GET',
      });

      expect(body.id).toBeDefined();
      // expect(body.category.id).toBe(data.categories[1].id);
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
    });

    test('Get cat1 without relations', async () => {
      let { body } = await rq({
        url: `/content-manager/collection-types/application::category.category/${data.categories[0].id}`,
        method: 'GET',
      });

      expect(body.id).toBeDefined();
      // expect(body.articles.length).toBe(0);
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
    });

    test('Get cat2 with article2', async () => {
      let { body } = await rq({
        url: `/content-manager/collection-types/application::category.category/${data.categories[1].id}`,
        method: 'GET',
      });

      expect(body.id).toBeDefined();
      // expect(body.articles.length).toBe(1);
      // expect(body.articles[0].id).toBe(data.articles[1].id);
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
    });

    test('Get cat3 with article1', async () => {
      let { body } = await rq({
        url: `/content-manager/collection-types/application::category.category/${data.categories[2].id}`,
        method: 'GET',
      });

      expect(body.id).toBeDefined();
      // expect(body.articles.length).toBe(1);
      // expect(body.articles[0].id).toBe(data.articles[0].id);
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
    });
  });

  describe('Test oneToOne relation (article - reference) with Content Manager', () => {
    beforeAll(() => {
      data = {
        articles: [],
        references: [],
      };
    });

    afterAll(async () => {
      await deleteFixtures();
    });

    test('Create ref1', async () => {
      let { body } = await rq({
        url: '/content-manager/collection-types/application::reference.reference',
        method: 'POST',
        body: {
          name: 'ref1',
        },
      });

      data.references.push(body);

      expect(body.id).toBeDefined();
      expect(body.name).toBe('ref1');
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
    });

    test('Create article1', async () => {
      const entry = {
        title: 'Article 1',
        content: 'Content 1',
      };

      let { body } = await rq({
        url: '/content-manager/collection-types/application::article.article',
        method: 'POST',
        body: entry,
      });

      data.articles.push(body);

      expect(body.id).toBeDefined();
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
      expect(body.published_at).toBeUndefined();
    });

    test('Update article1 with ref1', async () => {
      const entry = Object.assign({}, data.articles[0], {
        reference: data.references[0].id,
      });

      cleanDate(entry);

      let { body } = await rq({
        url: `/content-manager/collection-types/application::article.article/${entry.id}`,
        method: 'PUT',
        body: entry,
      });

      data.articles[0] = body;

      expect(body.id).toBeDefined();
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      // expect(body.reference.id).toBe(entry.reference);
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
    });

    test('Create article2 with ref1', async () => {
      const entry = {
        title: 'Article 2',
        content: 'Content 2',
        reference: data.references[0].id,
      };

      let { body } = await rq({
        url: '/content-manager/collection-types/application::article.article',
        method: 'POST',
        body: entry,
      });

      data.articles.push(body);

      expect(body.id).toBeDefined();
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      // expect(body.reference.id).toBe(entry.reference);
      // expect(body.created_by).toMatchObject({ email: 'admin@strapi.io' });
      // expect(body.updated_by).toMatchObject({ email: 'admin@strapi.io' });
    });
  });

  describe('Test oneWay relation (reference - tag) with Content Manager', () => {
    test('Attach Tag to a Reference', async () => {
      const { body: createdTag } = await rq({
        url: '/content-manager/collection-types/application::tag.tag',
        method: 'POST',
        body: {
          name: 'tag111',
        },
      });

      const { body: createdReference } = await rq({
        url: '/content-manager/collection-types/application::reference.reference',
        method: 'POST',
        body: {
          name: 'cat111',
          tag: createdTag,
        },
      });

      expect(createdReference.id).toBeDefined();
      // expect(createdReference.tag.id).toBe(createdTag.id);
    });

    test('Detach Tag to a Reference', async () => {
      const { body: createdTag } = await rq({
        url: '/content-manager/collection-types/application::tag.tag',
        method: 'POST',
        body: {
          name: 'tag111',
        },
      });

      const { body: createdReference } = await rq({
        url: '/content-manager/collection-types/application::reference.reference',
        method: 'POST',
        body: {
          name: 'cat111',
          tag: createdTag,
        },
      });

      // expect(createdReference.tag.id).toBe(createdTag.id);

      const { body: referenceToUpdate } = await rq({
        url: `/content-manager/collection-types/application::reference.reference/${createdReference.id}`,
        method: 'PUT',
        body: {
          tag: null,
        },
      });

      // expect(referenceToUpdate.tag).toBe(null);
    });

    test('Delete Tag so the relation in the Reference side should be removed', async () => {
      const { body: createdTag } = await rq({
        url: '/content-manager/collection-types/application::tag.tag',
        method: 'POST',
        body: {
          name: 'tag111',
        },
      });

      const { body: createdReference } = await rq({
        url: '/content-manager/collection-types/application::reference.reference',
        method: 'POST',
        body: {
          name: 'cat111',
          tag: createdTag,
        },
      });

      await rq({
        url: `/content-manager/collection-types/application::tag.tag/${createdTag.id}`,
        method: 'DELETE',
      });

      const { body: foundReference } = await rq({
        url: `/content-manager/collection-types/application::reference.reference/${createdReference.id}`,
        method: 'GET',
      });

      if (!foundReference.tag || Object.keys(foundReference.tag).length === 0) return;

      expect(foundReference.tag).toBe(null);
    });
  });
});
