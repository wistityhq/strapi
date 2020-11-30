'use strict';

const { registerAndLogin } = require('../../../test/helpers/auth');
const createModelsUtils = require('../../../test/helpers/models');
const { createRequest, createAuthRequest } = require('../../../test/helpers/request');

const edition = process.env.STRAPI_DISABLE_EE === 'true' ? 'CE' : 'EE';

if (edition === 'EE') {
  describe('Admin Permissions - Conditions', () => {
    let requests = {
      public: createRequest(),
      admin: null,
    };

    let modelsUtils;

    const localTestData = {
      model: {
        article: {
          name: 'article',
          attributes: {
            title: {
              type: 'string',
            },
            price: {
              type: 'integer',
            },
          },
        },
      },
      entry: {
        name: 'Test Article',
        price: 999,
      },
      role: {
        name: 'foobar',
        description: 'A dummy test role',
      },
      permissions: [
        {
          action: 'plugins::content-manager.explorer.create',
          subject: 'application::article.article',
          fields: null,
          conditions: [],
        },
        {
          action: 'plugins::content-manager.explorer.read',
          subject: 'application::article.article',
          fields: null,
          conditions: ['admin::has-same-role-as-creator'],
        },
        {
          action: 'plugins::content-manager.explorer.delete',
          subject: 'application::article.article',
          fields: null,
          conditions: ['admin::is-creator'],
        },
      ],
      userPassword: 'fooBar42',
      users: [
        { firstname: 'Alice', lastname: 'Foo', email: 'alice.foo@test.com' },
        { firstname: 'Bob', lastname: 'Bar', email: 'bob.bar@test.com' },
      ],
    };

    const createFixtures = async () => {
      // Login with admin and init admin tools
      const adminToken = await registerAndLogin();
      requests.admin = createAuthRequest(adminToken);

      modelsUtils = createModelsUtils({ rq: requests.admin });

      // Create the Article content-type
      await modelsUtils.createContentType(localTestData.model.article);

      // Create the foobar role
      const {
        body: { data: role },
      } = await requests.admin({
        method: 'POST',
        url: '/admin/roles',
        body: localTestData.role,
      });
      localTestData.role = role;

      // Assign permissions to the foobar role
      const {
        body: { data: permissions },
      } = await requests.admin({
        method: 'put',
        url: `/admin/roles/${localTestData.role.id}/permissions`,
        body: { permissions: localTestData.permissions },
      });
      localTestData.permissions = permissions;

      // Create users with the created role & create associated auth requests
      for (let i = 0; i < localTestData.users.length; i++) {
        const {
          body: { data: createdUser },
        } = await requests.admin({
          method: 'POST',
          url: '/admin/users',
          body: {
            ...localTestData.users[i],
            roles: [localTestData.role.id],
          },
        });
        localTestData.users[i] = createdUser;

        const { firstname, lastname } = localTestData.users[i];
        const {
          body: {
            data: { token, user: registeredUser },
          },
        } = await requests.public({
          method: 'POST',
          url: 'admin/register',
          body: {
            registrationToken: localTestData.users[i].registrationToken,
            userInfo: { firstname, lastname, password: localTestData.userPassword },
          },
        });
        localTestData.users[i] = registeredUser;
        requests[registeredUser.id] = createAuthRequest(token);
      }
    };

    const getUserRequest = idx => requests[localTestData.users[idx].id];
    const getModelName = () => localTestData.model.article.name;

    const deleteFixtures = async () => {
      // Delete users
      for (const user of localTestData.users) {
        await requests.admin({
          method: 'DELETE',
          url: `/admin/users/${user.id}`,
        });
      }

      // Delete the foobar role
      await requests.admin({
        method: 'DELETE',
        url: `/admin/roles/${localTestData.role.id}`,
      });

      // Cleanup and delete content-type
      const { name: modelName } = localTestData.model.article;
      await modelsUtils.cleanupContentType(modelName);
      await modelsUtils.deleteContentType(modelName);
    };

    beforeAll(async () => {
      await createFixtures();
    });

    afterAll(async () => {
      await deleteFixtures();
    });

    test('User A can create an entry', async () => {
      const rq = getUserRequest(0);
      const modelName = getModelName();
      const res = await rq({
        method: 'POST',
        url: `/content-manager/collection-types/application::${modelName}.${modelName}`,
        body: localTestData.entry,
      });

      expect(res.statusCode).toBe(200);
      localTestData.entry = res.body;
    });

    test('User A can read its entry', async () => {
      const { id } = localTestData.entry;
      const modelName = getModelName();
      const rq = getUserRequest(0);
      const res = await rq({
        method: 'GET',
        url: `/content-manager/collection-types/application::${modelName}.${modelName}/${id}`,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject(localTestData.entry);
    });

    test('User B can read the entry created by user A', async () => {
      const { id } = localTestData.entry;
      const modelName = getModelName();
      const rq = getUserRequest(1);
      const res = await rq({
        method: 'GET',
        url: `/content-manager/collection-types/application::${modelName}.${modelName}/${id}`,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject(localTestData.entry);
    });

    test('User B cannot delete the entry created by user A', async () => {
      const { id } = localTestData.entry;
      const modelName = getModelName();
      const rq = getUserRequest(1);

      const res = await rq({
        method: 'DELETE',
        url: `/content-manager/collection-types/application::${modelName}.${modelName}/${id}`,
      });

      expect(res.statusCode).toBe(403);
    });

    test('User A can delete its entry', async () => {
      const { id } = localTestData.entry;
      const modelName = getModelName();
      const rq = getUserRequest(0);
      const res = await rq({
        method: 'DELETE',
        url: `/content-manager/collection-types/application::${modelName}.${modelName}/${id}`,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject(localTestData.entry);
    });
  });
} else {
  describe('Admin Permissions - Conditions ', () => {
    test.skip('Only in EE', () => {});
  });
}
