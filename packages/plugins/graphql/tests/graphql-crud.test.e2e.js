'use strict';

// Helpers.
const { createTestBuilder } = require('../../../../test/helpers/builder');
const { createStrapiInstance } = require('../../../../test/helpers/strapi');
const { createAuthRequest } = require('../../../../test/helpers/request');

const builder = createTestBuilder();
let strapi;
let rq;
let graphqlQuery;

const postModel = {
  attributes: {
    name: {
      type: 'richtext',
    },
    bigint: {
      type: 'biginteger',
    },
    nullable: {
      type: 'string',
    },
  },
  name: 'post',
  description: '',
  collectionName: '',
};

describe('Test Graphql API End to End', () => {
  beforeAll(async () => {
    await builder.addContentType(postModel).build();

    strapi = await createStrapiInstance();
    rq = await createAuthRequest({ strapi });

    graphqlQuery = body => {
      return rq({
        url: '/graphql',
        method: 'POST',
        body,
      });
    };
  });

  afterAll(async () => {
    await strapi.destroy();
    await builder.cleanup();
  });

  describe('Test CRUD', () => {
    const postsPayload = [
      { name: 'post 1', bigint: 1316130638171, nullable: 'value' },
      { name: 'post 2', bigint: 1416130639261, nullable: null },
    ];
    let data = {
      posts: [],
    };

    test.each(postsPayload)('Create Post %o', async post => {
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          mutation createPost($input: createPostInput) {
            createPost(input: $input) {
              post {
                name
                bigint
                nullable
              }
            }
          }
        `,
        variables: {
          input: {
            data: post,
          },
        },
      });

      const { body } = res;

      expect(res.statusCode).toBe(200);
      expect(body).toEqual({
        data: {
          createPost: {
            post,
          },
        },
      });
    });

    test('List posts', async () => {
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          {
            posts {
              id
              name
              bigint
              nullable
            }
          }
        `,
      });

      const { body } = res;

      expect(res.statusCode).toBe(200);
      expect(body).toMatchObject({
        data: {
          posts: postsPayload,
        },
      });

      // assign for later use
      data.posts = res.body.data.posts;
    });

    test('List posts with limit', async () => {
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          {
            posts(limit: 1) {
              id
              name
              bigint
              nullable
            }
          }
        `,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        data: {
          posts: [data.posts[0]],
        },
      });
    });

    test('List posts with sort', async () => {
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          {
            posts(sort: "name:desc") {
              id
              name
              bigint
              nullable
            }
          }
        `,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        data: {
          posts: [...data.posts].reverse(),
        },
      });
    });

    test('List posts with start', async () => {
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          {
            posts(start: 1) {
              id
              name
              bigint
              nullable
            }
          }
        `,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        data: {
          posts: [data.posts[1]],
        },
      });
    });

    test.skip('List posts with `created_by` and `updated_by`', async () => {
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          {
            posts(start: 1) {
              id
              name
              bigint
              nullable
              created_by {
                username
              }
              updated_by {
                username
              }
            }
          }
        `,
      });

      expect(res.statusCode).toBe(200);

      // no errors should be present in the response
      expect(res.body.error).toBeUndefined();

      // since the posts are created without AdminUser, it should return null
      expect(res.body.data.posts[0].created_by).toBeNull();
    });

    test.each([
      [
        {
          name: 'post 1',
          bigint: 1316130638171,
        },
        [postsPayload[0]],
      ],
      [
        {
          name_eq: 'post 1',
          bigint_eq: 1316130638171,
        },
        [postsPayload[0]],
      ],
      [
        {
          name_ne: 'post 1',
          bigint_ne: 1316130638171,
        },
        [postsPayload[1]],
      ],
      [
        {
          name_contains: 'Post',
        },
        postsPayload,
      ],
      [
        {
          name_contains: 'Post 1',
        },
        [postsPayload[0]],
      ],
      [
        {
          name_containss: 'post',
        },
        postsPayload,
      ],
      [
        {
          name_ncontainss: 'post 1',
        },
        [postsPayload[1]],
      ],
      [
        {
          name_in: ['post 1', 'post 2', 'post 3'],
        },
        postsPayload,
      ],
      [
        {
          name_nin: ['post 2'],
        },
        [postsPayload[0]],
      ],
      [
        {
          nullable_null: true,
        },
        [postsPayload[1]],
      ],
      [
        {
          nullable_null: false,
        },
        [postsPayload[0]],
      ],
      [
        {
          _or: [{ name_in: ['post 2'] }, { bigint_eq: 1316130638171 }],
        },
        [postsPayload[0], postsPayload[1]],
      ],
      [
        {
          _where: { nullable_null: false },
        },
        [postsPayload[0]],
      ],
      [
        {
          _where: { _or: { nullable_null: false } },
        },
        [postsPayload[0]],
      ],
      [
        {
          _where: [{ nullable_null: false }],
        },
        [postsPayload[0]],
      ],
      [
        {
          _where: [{ _or: [{ name_in: ['post 2'] }, { bigint_eq: 1316130638171 }] }],
        },
        [postsPayload[0], postsPayload[1]],
      ],
      [
        {
          _where: [
            {
              _or: [
                { name_in: ['post 2'] },
                { _or: [{ bigint_eq: 1316130638171 }, { nullable_null: false }] },
              ],
            },
          ],
        },
        [postsPayload[0], postsPayload[1]],
      ],
    ])('List posts with where clause %o', async (where, expected) => {
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          query findPosts($where: JSON) {
            posts(where: $where) {
              name
              bigint
              nullable
            }
          }
        `,
        variables: {
          where,
        },
      });

      expect(res.statusCode).toBe(200);

      // same length
      expect(res.body.data.posts.length).toBe(expected.length);

      // all the posts returned are in the expected array
      res.body.data.posts.forEach(post => {
        expect(expected).toEqual(expect.arrayContaining([post]));
      });

      // all expected values are in the result
      expected.forEach(expectedPost => {
        expect(res.body.data.posts).toEqual(expect.arrayContaining([expectedPost]));
      });
    });

    test('Get One Post', async () => {
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          query getPost($id: ID!) {
            post(id: $id) {
              id
              name
              bigint
              nullable
            }
          }
        `,
        variables: {
          id: data.posts[0].id,
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        data: {
          post: data.posts[0],
        },
      });
    });

    test('Update Post', async () => {
      const newName = 'new post name';
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          mutation updatePost($input: updatePostInput) {
            updatePost(input: $input) {
              post {
                id
                name
              }
            }
          }
        `,
        variables: {
          input: {
            where: {
              id: data.posts[0].id,
            },
            data: {
              name: newName,
            },
          },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        data: {
          updatePost: {
            post: {
              id: data.posts[0].id,
              name: newName,
            },
          },
        },
      });

      data.posts[0] = res.body.data.updatePost.post;
    });

    test('Delete Posts', async () => {
      for (let post of data.posts) {
        const res = await graphqlQuery({
          query: /* GraphQL */ `
            mutation deletePost($input: deletePostInput) {
              deletePost(input: $input) {
                post {
                  id
                  name
                  bigint
                }
              }
            }
          `,
          variables: {
            input: {
              where: {
                id: post.id,
              },
            },
          },
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({
          data: {
            deletePost: {
              post: {
                id: post.id,
              },
            },
          },
        });
      }
    });
  });
});
