'use strict';

// Helpers.
const { createStrapiInstance } = require('../../../../test/helpers/strapi');
const { createAuthRequest } = require('../../../../test/helpers/request');
const { createTestBuilder } = require('../../../../test/helpers/builder');
const modelsUtils = require('../../../../test/helpers/models');

const form = require('../../../../test/helpers/generators');

const cleanDate = entry => {
  delete entry.updatedAt;
  delete entry.createdAt;
  delete entry.created_at;
  delete entry.updated_at;
};

const builder = createTestBuilder();
let data;
let rq;
let strapi;

describe('Create Strapi API End to End', () => {
  beforeAll(async () => {
    await builder
      .addContentTypes([form.article, form.tag, form.category, form.reference, form.product], {
        batch: true,
      })
      .build();

    strapi = await createStrapiInstance();
    rq = await createAuthRequest({ strapi });
  });

  afterAll(async () => {
    await strapi.destroy();
    await builder.cleanup();
  });

  describe('Test manyToMany relation (article - tag) with Content Manager', () => {
    beforeAll(async () => {
      data = {
        articles: [],
        tags: [],
      };
    });

    test('Create tag1', async () => {
      const { body } = await rq({
        url: '/tags',
        method: 'POST',
        body: {
          name: 'tag1',
        },
      });

      data.tags.push(body);

      expect(body.id);
      expect(body.name).toBe('tag1');
    });

    test('Create tag2', async () => {
      const { body } = await rq({
        url: '/tags',
        method: 'POST',
        body: {
          name: 'tag2',
        },
      });

      data.tags.push(body);

      expect(body.id);
      expect(body.name).toBe('tag2');
    });

    test('Create tag3', async () => {
      const { body } = await rq({
        url: '/tags',
        method: 'POST',
        body: {
          name: 'tag3',
        },
      });

      data.tags.push(body);

      expect(body.id);
      expect(body.name).toBe('tag3');
    });

    test('Create article1 without relation', async () => {
      const entry = {
        title: 'Article 1',
        content: 'My super content 1',
      };

      const { body } = await rq({
        url: '/articles',
        method: 'POST',
        body: entry,
      });

      data.articles.push(body);

      expect(body.id);
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
    });

    test('Create article2 with tag1', async () => {
      const entry = {
        title: 'Article 2',
        content: 'Content 2',
        tags: [data.tags[0].id],
      };

      const { body } = await rq({
        url: '/articles',
        method: 'POST',
        body: entry,
        qs: {
          populate: ['tags'],
        },
      });

      data.articles.push(body);

      expect(body.id);
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      expect(Array.isArray(body.tags)).toBeTruthy();
      expect(body.tags.length).toBe(1);
      expect(body.tags[0].id).toBe(data.tags[0].id);
    });

    test('Update article1 add tag2', async () => {
      const entry = Object.assign({}, data.articles[0], {
        tags: [data.tags[1].id],
      });

      cleanDate(entry);

      const { body } = await rq({
        url: `/articles/${entry.id}`,
        method: 'PUT',
        body: entry,
        qs: {
          populate: ['tags'],
        },
      });

      data.articles[0] = body;

      expect(body.id);
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      expect(Array.isArray(body.tags)).toBeTruthy();
      expect(body.tags.length).toBe(1);
      expect(body.tags[0].id).toBe(data.tags[1].id);
    });

    test('Update article1 add tag1 and tag3', async () => {
      const entry = Object.assign({}, data.articles[0]);
      entry.tags = data.tags.map(t => t.id);

      cleanDate(entry);

      const { body } = await rq({
        url: `/articles/${entry.id}`,
        method: 'PUT',
        body: entry,
        qs: {
          populate: ['tags'],
        },
      });

      data.articles[0] = body;

      expect(body.id);
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      expect(Array.isArray(body.tags)).toBeTruthy();
      expect(body.tags.length).toBe(3);
    });

    test('Update article1 remove one tag', async () => {
      const entry = Object.assign({}, data.articles[0]);
      entry.tags = entry.tags.slice(1).map(t => t.id);

      cleanDate(entry);

      const { body } = await rq({
        url: `/articles/${entry.id}`,
        method: 'PUT',
        body: entry,
        qs: {
          populate: ['tags'],
        },
      });

      data.articles[0] = body;

      expect(body.id);
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      expect(Array.isArray(body.tags)).toBeTruthy();
      expect(body.tags.length).toBe(2);
    });

    test('Update article1 remove all tag', async () => {
      const entry = Object.assign({}, data.articles[0], {
        tags: [],
      });

      cleanDate(entry);

      const { body } = await rq({
        url: `/articles/${entry.id}`,
        method: 'PUT',
        body: entry,
        qs: {
          populate: ['tags'],
        },
      });

      data.articles[0] = body;

      expect(body.id);
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      expect(Array.isArray(body.tags)).toBeTruthy();
      expect(body.tags.length).toBe(0);
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
      await modelsUtils.cleanupModels([form.article.uid, form.category.uid], { strapi });
    });

    test('Create cat1', async () => {
      const { body } = await rq({
        url: '/categories',
        method: 'POST',
        body: {
          name: 'cat1',
        },
        qs: {
          populate: ['articles'],
        },
      });

      data.categories.push(body);

      expect(body.id);
      expect(body.name).toBe('cat1');
    });

    test('Create cat2', async () => {
      const { body } = await rq({
        url: '/categories',
        method: 'POST',
        body: {
          name: 'cat2',
        },
        qs: {
          populate: ['articles'],
        },
      });

      data.categories.push(body);

      expect(body.id);
      expect(body.name).toBe('cat2');
    });

    test('Create article1 with cat1', async () => {
      const entry = {
        title: 'Article 1',
        content: 'Content 1',
        category: data.categories[0].id,
      };

      const { body } = await rq({
        url: '/articles',
        method: 'POST',
        body: entry,
        qs: {
          populate: ['category'],
        },
      });

      data.articles.push(body);

      expect(body.id);
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      expect(body.category.name).toBe(data.categories[0].name);
    });

    test('Update article1 with cat2', async () => {
      const entry = Object.assign({}, data.articles[0], {
        category: data.categories[1].id,
      });

      cleanDate(entry);

      const { body } = await rq({
        url: `/articles/${entry.id}`,
        method: 'PUT',
        body: entry,
        qs: {
          populate: ['category'],
        },
      });

      data.articles[0] = body;

      expect(body.id);
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      expect(body.category.name).toBe(data.categories[1].name);
    });

    test('Create article2', async () => {
      const entry = {
        title: 'Article 2',
        content: 'Content 2',
      };

      const { body } = await rq({
        url: '/articles',
        method: 'POST',
        body: entry,
      });

      data.articles.push(body);

      expect(body.id);
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
    });

    test('Update article2 with cat2', async () => {
      const entry = Object.assign({}, data.articles[1], {
        category: data.categories[1].id,
      });

      cleanDate(entry);

      const { body } = await rq({
        url: `/articles/${entry.id}`,
        method: 'PUT',
        body: entry,
        qs: {
          populate: ['category'],
        },
      });

      data.articles[1] = body;

      expect(body.id);
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      expect(body.category.name).toBe(data.categories[1].name);
    });

    test('Update cat1 with article1', async () => {
      const entry = Object.assign({}, data.categories[0]);
      entry.articles = data.categories[0].articles.map(a => a.id).concat(data.articles[0].id);

      cleanDate(entry);

      const { body } = await rq({
        url: `/categories/${entry.id}`,
        method: 'PUT',
        body: entry,
        qs: {
          populate: ['articles'],
        },
      });

      data.categories[0] = body;

      expect(body.id);
      expect(Array.isArray(body.articles)).toBeTruthy();
      expect(body.articles.length).toBe(1);
      expect(body.name).toBe(entry.name);
    });

    test('Create cat3 with article1', async () => {
      const entry = {
        name: 'cat3',
        articles: [data.articles[0].id],
      };

      const { body } = await rq({
        url: '/categories',
        method: 'POST',
        body: entry,
        qs: {
          populate: ['articles'],
        },
      });

      data.categories.push(body);

      expect(body.id);
      expect(Array.isArray(body.articles)).toBeTruthy();
      expect(body.articles.length).toBe(1);
      expect(body.name).toBe(entry.name);
    });

    test('Get article1 with cat3', async () => {
      const { body } = await rq({
        url: `/articles/${data.articles[0].id}`,
        method: 'GET',
        qs: {
          populate: ['category'],
        },
      });

      expect(body.id);
      expect(body.category.id).toBe(data.categories[2].id);
    });

    test('Get article2 with cat2', async () => {
      const { body } = await rq({
        url: `/articles/${data.articles[1].id}`,
        method: 'GET',
        qs: {
          populate: ['category'],
        },
      });

      expect(body.id);
      expect(body.category.id).toBe(data.categories[1].id);
    });

    test('Get cat1 without relations', async () => {
      const { body } = await rq({
        url: `/categories/${data.categories[0].id}`,
        method: 'GET',
        qs: {
          populate: ['articles'],
        },
      });

      expect(body.id);
      expect(body.articles.length).toBe(0);
    });

    test('Get cat2 with article2', async () => {
      const { body } = await rq({
        url: `/categories/${data.categories[1].id}`,
        method: 'GET',
        qs: {
          populate: ['articles'],
        },
      });

      expect(body.id);
      expect(body.articles.length).toBe(1);
      expect(body.articles[0].id).toBe(data.articles[1].id);
    });

    test('Get cat3 with article1', async () => {
      const { body } = await rq({
        url: `/categories/${data.categories[2].id}`,
        method: 'GET',
        qs: {
          populate: ['articles'],
        },
      });

      expect(body.id);
      expect(body.articles.length).toBe(1);
      expect(body.articles[0].id).toBe(data.articles[0].id);
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
      await modelsUtils.cleanupModels([form.article.uid, form.reference.uid], { strapi });
    });

    test('Create ref1', async () => {
      const { body } = await rq({
        url: '/references',
        method: 'POST',
        body: {
          name: 'ref1',
        },
      });

      data.references.push(body);

      expect(body.id);
      expect(body.name).toBe('ref1');
    });

    test('Create article1', async () => {
      const entry = {
        title: 'Article 1',
        content: 'Content 1',
      };

      const { body } = await rq({
        url: '/articles',
        method: 'POST',
        body: entry,
      });

      data.articles.push(body);

      expect(body.id);
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
    });

    test('Update article1 with ref1', async () => {
      const entry = Object.assign({}, data.articles[0], {
        reference: data.references[0].id,
      });

      cleanDate(entry);

      const { body } = await rq({
        url: `/articles/${entry.id}`,
        method: 'PUT',
        body: entry,
        qs: {
          populate: ['reference'],
        },
      });

      data.articles[0] = body;

      expect(body.id);
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      expect(body.reference.id).toBe(entry.reference);
    });

    test('Create article2 with ref1', async () => {
      const entry = {
        title: 'Article 2',
        content: 'Content 2',
        reference: data.references[0].id,
      };

      const { body } = await rq({
        url: '/articles',
        method: 'POST',
        body: entry,
        qs: {
          populate: ['reference'],
        },
      });

      data.articles.push(body);

      expect(body.id);
      expect(body.title).toBe(entry.title);
      expect(body.content).toBe(entry.content);
      expect(body.reference.id).toBe(entry.reference);
    });
  });

  describe('Test oneWay relation (reference - tag) with Content Manager', () => {
    beforeAll(() => {
      data = {
        tags: [],
        references: [],
      };
    });

    afterAll(async () => {
      await modelsUtils.cleanupModels([form.reference.uid, form.tag.uid], { strapi });
    });

    test('Attach Tag to a Reference', async () => {
      const { body: createdTag } = await rq({
        url: '/tags',
        method: 'POST',
        body: {
          name: 'tag111',
        },
      });

      data.tags.push(createdTag);

      const { body: createdReference } = await rq({
        url: '/references',
        method: 'POST',
        body: {
          name: 'cat111',
          tag: createdTag.id,
        },
        qs: {
          populate: ['tag'],
        },
      });

      data.references.push(createdReference);
      expect(createdReference.tag.id).toBe(createdTag.id);
    });

    test('Detach Tag from a Reference', async () => {
      const { body: createdTag } = await rq({
        url: '/tags',
        method: 'POST',
        body: {
          name: 'tag111',
        },
      });

      data.tags.push(createdTag);

      const { body: createdReference } = await rq({
        url: '/references',
        method: 'POST',
        body: {
          name: 'cat111',
          tag: createdTag.id,
        },
        qs: {
          populate: ['tag'],
        },
      });

      data.references.push(createdReference);

      expect(createdReference.tag.id).toBe(createdTag.id);

      const { body: updatedReference } = await rq({
        url: `/references/${createdReference.id}`,
        method: 'PUT',
        body: {
          tag: null,
        },
        qs: {
          populate: ['tag'],
        },
      });

      expect(updatedReference.tag).toBe(null);
    });

    test('Delete Tag so the relation in the Reference side should be removed', async () => {
      const { body: createdTag } = await rq({
        url: '/tags',
        method: 'POST',
        body: {
          name: 'tag111',
        },
      });

      data.tags.push(createdTag);

      const { body: createdReference } = await rq({
        url: '/references',
        method: 'POST',
        body: {
          name: 'cat111',
          tag: createdTag.id,
        },
        qs: {
          populate: ['tag'],
        },
      });

      data.references.push(createdReference);

      await rq({
        url: `/tags/${createdTag.id}`,
        method: 'DELETE',
      });

      const { body: foundReference } = await rq({
        url: `/references/${createdReference.id}`,
        method: 'GET',
        qs: {
          populate: ['tag'],
        },
      });

      expect(foundReference.tag).toBe(null);
    });
  });
});
