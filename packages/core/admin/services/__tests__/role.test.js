'use strict';

const _ = require('lodash');
const roleService = require('../role');
const { SUPER_ADMIN_CODE } = require('../constants');
const { create: createPermission, toPermission } = require('../../domain/permission');

describe('Role', () => {
  describe('create', () => {
    test('Creates a role', async () => {
      const dbCreate = jest.fn(({ data }) => Promise.resolve(data));
      const dbCount = jest.fn(() => Promise.resolve(0));

      global.strapi = {
        query: () => ({ create: dbCreate, count: dbCount }),
      };

      const input = {
        name: 'super_admin',
        description: "Have all permissions. Can't be delete",
        code: 'super-admin',
      };

      const createdRole = await roleService.create(input);

      expect(dbCreate).toHaveBeenCalledWith({ data: input });
      expect(createdRole).toStrictEqual(input);
    });
  });

  describe('findOne', () => {
    test('Finds a role', async () => {
      const role = {
        id: 1,
        name: 'super_admin',
        description: "Have all permissions. Can't be delete",
      };
      const dbFindOne = jest.fn(({ where: { id } }) => Promise.resolve(_.find([role], { id })));

      global.strapi = {
        query: () => ({ findOne: dbFindOne }),
      };

      const foundRole = await roleService.findOne({ id: role.id });

      expect(dbFindOne).toHaveBeenCalledWith({ where: { id: role.id } });
      expect(foundRole).toStrictEqual(role);
    });

    test('Finds a role with usersCount', async () => {
      const role = {
        id: 1,
        name: 'super_admin',
        description: "Have all permissions. Can't be delete",
        usersCount: 0,
      };
      const dbFindOne = jest.fn(({ where: { id } }) =>
        Promise.resolve(_.find([_.omit(role, ['usersCount'])], { id }))
      );
      const dbCount = jest.fn(() => Promise.resolve(0));
      global.strapi = {
        query: () => ({ findOne: dbFindOne, count: dbCount }),
      };

      const foundRole = await roleService.findOneWithUsersCount({ id: role.id });

      expect(dbFindOne).toHaveBeenCalledWith({ where: { id: role.id } });
      expect(dbCount).toHaveBeenCalledWith({ where: { roles: { id: role.id } } });
      expect(foundRole).toStrictEqual(role);
    });
  });

  describe('find', () => {
    test('Finds roles', async () => {
      const roles = [
        {
          id: 1,
          name: 'super_admin',
          description: "Have all permissions. Can't be delete",
        },
      ];
      const dbFind = jest.fn(() => Promise.resolve(roles));

      global.strapi = {
        query: () => ({ findMany: dbFind }),
      };

      const foundRoles = await roleService.find();

      expect(dbFind).toHaveBeenCalledWith({ where: {} });
      expect(foundRoles).toStrictEqual(roles);
    });
  });

  describe('findAll', () => {
    test('Finds all roles', async () => {
      const roles = [
        {
          id: 1,
          name: 'super_admin',
          description: "Have all permissions. Can't be delete",
          usersCount: 0,
        },
      ];
      const dbFind = jest.fn(() =>
        Promise.resolve(roles.map(role => _.omit(role, ['usersCount'])))
      );
      const dbCount = jest.fn(() => Promise.resolve(0));

      global.strapi = {
        query: () => ({ findMany: dbFind, count: dbCount }),
      };

      const foundRoles = await roleService.findAllWithUsersCount();

      expect(dbFind).toHaveBeenCalledWith({});
      expect(foundRoles).toStrictEqual(roles);
    });
  });

  describe('update', () => {
    test('Updates a role', async () => {
      const role = {
        id: 1,
        name: 'super_admin',
        description: 'AAA',
      };

      const expectedUpdatedRole = {
        id: 1,
        name: 'super_admin_updated',
        description: 'AAA_updated',
      };

      const dbUpdate = jest.fn(() => Promise.resolve(expectedUpdatedRole));
      const dbCount = jest.fn(() => Promise.resolve(0));

      global.strapi = {
        query: () => ({ update: dbUpdate, count: dbCount }),
      };

      const updatedRole = await roleService.update(
        {
          id: role.id,
        },
        {
          name: expectedUpdatedRole.name,
          description: expectedUpdatedRole.description,
        }
      );

      expect(dbUpdate).toHaveBeenCalledWith({
        where: {
          id: role.id,
        },
        data: {
          name: expectedUpdatedRole.name,
          description: expectedUpdatedRole.description,
        },
      });

      expect(updatedRole).toStrictEqual(expectedUpdatedRole);
    });

    test('Cannot update code of super admin role', async () => {
      const dbUpdate = jest.fn();
      const dbFind = jest.fn(() => [{ id: '1' }]);
      const dbFindOne = jest.fn(() => ({ id: '1', code: SUPER_ADMIN_CODE }));
      const badRequest = jest.fn(() => {});

      global.strapi = {
        query: () => ({ find: dbFind, findOne: dbFindOne, update: dbUpdate }),
        admin: { config: { superAdminCode: SUPER_ADMIN_CODE } },
        errors: { badRequest },
      };

      await roleService.update({ id: 1 }, { code: 'new_code' });

      expect(dbUpdate).toHaveBeenCalledWith({ where: { id: 1 }, data: {} });
    });
  });

  describe('count', () => {
    test('getUsersCount', async () => {
      const roleId = 1;
      const dbCount = jest.fn(() => Promise.resolve(0));
      global.strapi = {
        query: () => ({ count: dbCount }),
      };

      const usersCount = await roleService.getUsersCount(roleId);

      expect(dbCount).toHaveBeenCalledWith({ where: { roles: { id: roleId } } });
      expect(usersCount).toEqual(0);
    });
  });

  describe('delete', () => {
    test('Delete a role', async () => {
      const role = {
        id: 3,
        name: 'admin',
        description: 'Description',
        users: [],
      };
      const dbCount = jest.fn(() => Promise.resolve(0));
      const dbFindOne = jest.fn(() => ({ id: 1, code: SUPER_ADMIN_CODE }));
      const dbDelete = jest.fn(() => Promise.resolve(role));
      const dbDeleteByRolesIds = jest.fn(() => Promise.resolve());

      global.strapi = {
        query: () => ({ delete: dbDelete, count: dbCount, findOne: dbFindOne }),
        store: () => ({
          get: () => ({
            providers: {
              defaultRole: null,
            },
          }),
        }),
        admin: {
          services: {
            permission: { deleteByRolesIds: dbDeleteByRolesIds },
          },
          config: { superAdminCode: SUPER_ADMIN_CODE },
        },
      };

      const deletedRoles = await roleService.deleteByIds([role.id]);

      expect(dbCount).toHaveBeenCalledWith({ where: { roles: { id: role.id } } });
      expect(dbDelete).toHaveBeenCalledWith({ where: { id: role.id } });

      expect(deletedRoles).toStrictEqual([role]);
    });

    test('Delete two roles', async () => {
      const roles = [
        {
          id: 1,
          name: 'admin 1',
          description: 'Description',
          users: [],
        },
        {
          id: 2,
          name: 'admin 2',
          description: 'Description',
          users: [],
        },
      ];
      const dbCount = jest.fn(() => Promise.resolve(0));
      const dbFindOne = jest.fn(() => ({ id: 3, code: SUPER_ADMIN_CODE }));
      const rolesIds = roles.map(r => r.id);
      const dbDelete = jest
        .fn()
        .mockImplementationOnce(() => Promise.resolve(roles[0]))
        .mockImplementationOnce(() => Promise.resolve(roles[1]));

      const dbGetUsersCount = jest.fn(() => Promise.resolve(0));
      const dbDeleteByRolesIds = jest.fn(() => Promise.resolve());

      global.strapi = {
        query: () => ({ delete: dbDelete, count: dbCount, findOne: dbFindOne }),
        store: () => ({
          get: () => ({
            providers: {
              defaultRole: null,
            },
          }),
        }),
        admin: {
          services: {
            permission: { deleteByRolesIds: dbDeleteByRolesIds },
            role: { getUsersCount: dbGetUsersCount },
          },
          config: { superAdminCode: SUPER_ADMIN_CODE },
        },
      };

      const deletedRoles = await roleService.deleteByIds(rolesIds);

      expect(dbCount).toHaveBeenNthCalledWith(1, { where: { roles: { id: rolesIds[0] } } });
      expect(dbCount).toHaveBeenNthCalledWith(2, { where: { roles: { id: rolesIds[1] } } });
      expect(dbCount).toHaveBeenCalledTimes(2);
      expect(dbDelete).toHaveBeenNthCalledWith(1, { where: { id: rolesIds[0] } });
      expect(dbDelete).toHaveBeenNthCalledWith(2, { where: { id: rolesIds[1] } });
      expect(deletedRoles).toStrictEqual(roles);
    });

    test('Cannot delete super admin role', async () => {
      const dbFind = jest.fn(() => [{ id: '1' }]);
      const dbFindOne = jest.fn(() => ({ id: '1', code: SUPER_ADMIN_CODE }));

      global.strapi = {
        query: () => ({ find: dbFind, findOne: dbFindOne }),
        store: () => ({
          get: () => ({
            providers: {
              defaultRole: null,
            },
          }),
        }),
        admin: { config: { superAdminCode: SUPER_ADMIN_CODE } },
      };

      expect(() => roleService.deleteByIds([1])).rejects.toThrowError(
        'You cannot delete the super admin role'
      );
    });

    test('Cannot delete a role attached to some user', async () => {
      const dbFind = jest.fn(() => []);
      const dbFindOne = jest.fn(() => ({}));
      const dbCount = jest.fn(() => 2);

      global.strapi = {
        query: () => ({ find: dbFind, findOne: dbFindOne, count: dbCount }),
        store: () => ({
          get: () => ({
            providers: {
              defaultRole: null,
            },
          }),
        }),
        admin: { config: { superAdminCode: SUPER_ADMIN_CODE } },
      };

      expect(() => roleService.deleteByIds([1])).rejects.toThrowError(
        'Some roles are still assigned to some users'
      );
    });
  });

  describe('Count roles', () => {
    test('Count roles without params', async () => {
      const count = jest.fn(() => Promise.resolve(2));
      global.strapi = {
        query: () => ({ count }),
      };

      const amount = await roleService.count();

      expect(amount).toBe(2);
      expect(count).toHaveBeenCalledWith({});
    });

    test('Count roles with params', async () => {
      const count = jest.fn(() => Promise.resolve(2));
      global.strapi = {
        query: () => ({ count }),
      };

      const params = { foo: 'bar' };
      const amount = await roleService.count(params);

      expect(amount).toBe(2);
      expect(count).toHaveBeenCalledWith(params);
    });
  });

  describe('createRolesIfNoneExist', () => {
    test("Don't create roles if one already exist", async () => {
      const count = jest.fn(() => Promise.resolve(1));
      const create = jest.fn();
      global.strapi = {
        query: () => ({ count, create }),
      };
      await roleService.createRolesIfNoneExist();

      expect(create).toHaveBeenCalledTimes(0);
    });

    test('Create 3 roles if none exist', async () => {
      const actions = [
        {
          actionId: 'action-1',
          subjects: ['country'],
          section: 'contentTypes',
          options: {
            applyToProperties: ['fields'],
          },
        },
      ];

      const permissions = [
        {
          action: 'action-1',
          subject: 'country',
          properties: { fields: ['name'] },
          conditions: [],
        },
      ];

      const defaultPermissions = [
        {
          action: 'plugins::upload.read',
          conditions: ['admin::is-creator'],
          properties: {},
          subject: null,
        },
        {
          action: 'plugins::upload.assets.create',
          conditions: [],
          properties: {},
          subject: null,
        },
        {
          action: 'plugins::upload.assets.update',
          conditions: ['admin::is-creator'],
          properties: {},
          subject: null,
        },
        {
          action: 'plugins::upload.assets.download',
          conditions: [],
          properties: {},
          subject: null,
        },
        {
          action: 'plugins::upload.assets.copy-link',
          conditions: [],
          properties: {},
          subject: null,
        },
      ];

      const count = jest.fn(() => Promise.resolve(0));
      let id = 1;
      const create = jest.fn(({ data }) => ({ ...data, id: id++ }));
      const values = jest.fn(() => actions);
      const createMany = jest.fn();
      const assignARoleToAll = jest.fn();
      const getPermissionsWithNestedFields = jest.fn(() => permissions.map(createPermission)); // cloned, otherwise it is modified inside createRolesIfNoneExist()

      global.strapi = {
        query: () => ({ count, create }),
        admin: {
          services: {
            permission: {
              actionProvider: { values },
              createMany,
              conditionProvider: { has: () => true },
            },
            condition: { isValidCondition: () => true },
            'content-type': { getPermissionsWithNestedFields },
            user: { assignARoleToAll },
          },
        },
      };

      await roleService.createRolesIfNoneExist();

      expect(create).toHaveBeenCalledTimes(3);

      expect(create).toHaveBeenNthCalledWith(1, {
        data: {
          name: 'Super Admin',
          code: 'strapi-super-admin',
          description: 'Super Admins can access and manage all features and settings.',
        },
      });

      expect(assignARoleToAll).toHaveBeenCalledWith(1);

      expect(create).toHaveBeenNthCalledWith(2, {
        data: {
          name: 'Editor',
          code: 'strapi-editor',
          description: 'Editors can manage and publish contents including those of other users.',
        },
      });

      expect(create).toHaveBeenNthCalledWith(3, {
        data: {
          name: 'Author',
          code: 'strapi-author',
          description: 'Authors can manage the content they have created.',
        },
      });

      expect(getPermissionsWithNestedFields).toHaveBeenCalledWith(actions, {
        restrictedSubjects: ['plugins::users-permissions.user'],
      });

      expect(createMany).toHaveBeenCalledTimes(2);

      expect(createMany).toHaveBeenNthCalledWith(
        1,
        [
          ...permissions,
          ...defaultPermissions.map(d => ({
            ...d,
            conditions: [],
          })),
        ].map(p => ({ ...p, role: 2 }))
      );

      expect(createMany).toHaveBeenNthCalledWith(
        2,
        [
          { ...permissions[0], conditions: ['admin::is-creator'] },
          ...defaultPermissions,
        ].map(p => ({ ...p, role: 3 }))
      );
    });
  });

  describe('displayWarningIfNoSuperAdmin', () => {
    test('superAdmin role exists & a user is superAdmin', async () => {
      const findOne = jest.fn(() => ({ id: 1 }));
      const count = jest.fn(() => Promise.resolve(1));
      const exists = jest.fn(() => Promise.resolve(true));
      const warn = jest.fn();

      global.strapi = {
        query: () => ({ findOne, count }),
        admin: { services: { user: { exists } } },
        log: { warn },
      };

      await roleService.displayWarningIfNoSuperAdmin();

      expect(warn).toHaveBeenCalledTimes(0);
    });
    test("superAdmin role doesn't exist", async () => {
      const findOne = jest.fn(() => undefined);
      const count = jest.fn(() => Promise.resolve(0));
      const exists = jest.fn(() => Promise.resolve(false));
      const warn = jest.fn();

      global.strapi = {
        query: () => ({ findOne, count }),
        admin: { services: { user: { exists } } },
        log: { warn },
      };

      await roleService.displayWarningIfNoSuperAdmin();

      expect(warn).toHaveBeenCalledWith("Your application doesn't have a super admin role.");
    });
    test('superAdmin role exist & no user is superAdmin', async () => {
      const findOne = jest.fn(() => ({ id: 1 }));
      const count = jest.fn(() => Promise.resolve(0));
      const exists = jest.fn(() => Promise.resolve(true));
      const warn = jest.fn();

      global.strapi = {
        query: () => ({ findOne, count }),
        admin: { services: { user: { exists } } },
        log: { warn },
      };

      await roleService.displayWarningIfNoSuperAdmin();

      expect(warn).toHaveBeenCalledWith("Your application doesn't have a super admin user.");
    });
  });

  describe('resetSuperAdminPermissions', () => {
    test('No superAdmin role exist', async () => {
      const getSuperAdmin = jest.fn(() => Promise.resolve(undefined));
      const createMany = jest.fn();

      global.strapi = {
        query: () => ({ createMany }),
        admin: { services: { role: { getSuperAdmin } } },
      };

      await roleService.resetSuperAdminPermissions();

      expect(createMany).toHaveBeenCalledTimes(0);
    });

    test('Reset super admin permissions', async () => {
      const roleId = 1;
      const actions = [
        {
          actionId: 'action-1',
          subjects: ['country'],
          section: 'contentTypes',
          options: {
            applyToProperties: ['fields'],
          },
        },
        {
          actionId: 'action-test2',
          subjects: ['test-subject1', 'test-subject2'],
          section: 'settings',
        },
        {
          actionId: 'action-test3',
          subjects: null,
          section: 'plugin',
        },
      ];
      const permissions = [
        {
          action: 'action-1',
          subject: 'country',
          properties: { fields: ['name'] },
          conditions: [],
        },
        {
          action: 'action-test2',
          subject: 'test-subject1',
          properties: {},
          conditions: [],
        },
        {
          action: 'action-test2',
          subject: 'test-subject2',
          properties: {},
          conditions: [],
        },
        {
          action: 'action-test3',
          subject: null,
          properties: {},
          conditions: [],
        },
      ];
      const values = jest.fn(() => actions);
      const getAllConditions = jest.fn(() => []);
      const findMany = jest.fn(() => [{ action: 'action-2', id: 2, properties: {} }]);
      const getPermissionsWithNestedFields = jest.fn(() => [
        {
          ...permissions[0],
        },
      ]); // cloned, otherwise it is modified inside resetSuperAdminPermissions()
      const deleteByIds = jest.fn();
      const getSuperAdmin = jest.fn(() => Promise.resolve({ id: roleId }));
      const createMany = jest.fn(() => []);
      const isValidCondition = jest.fn(() => true);

      global.strapi = {
        admin: {
          services: {
            permission: {
              createMany,
              findMany,
              actionProvider: { values },
              conditionProvider: { getAll: getAllConditions },
              deleteByIds,
            },
            condition: { isValidCondition },
            'content-type': { getPermissionsWithNestedFields },
            role: { getSuperAdmin },
          },
        },
      };

      await roleService.resetSuperAdminPermissions();

      expect(deleteByIds).toHaveBeenCalledWith([2]);
      expect(createMany).toHaveBeenCalledWith(
        expect.arrayContaining(
          permissions.map(perm => ({
            ...perm,
            role: roleId,
          }))
        )
      );
    });
  });

  describe('Assign permissions', () => {
    test('Delete previous permissions', async () => {
      const createMany = jest.fn(() => Promise.resolve([]));
      const getSuperAdmin = jest.fn(() => Promise.resolve({ id: 0 }));
      const sendDidUpdateRolePermissions = jest.fn();
      const findMany = jest.fn(() => Promise.resolve([{ id: 3 }]));
      const deleteByIds = jest.fn();
      const values = jest.fn(() => []);

      global.strapi = {
        admin: {
          services: {
            metrics: { sendDidUpdateRolePermissions },
            permission: { findMany, createMany, actionProvider: { values }, deleteByIds },
            role: { getSuperAdmin },
          },
        },
      };

      await roleService.assignPermissions(1, []);

      expect(deleteByIds).toHaveBeenCalledWith([3]);
    });

    test('Create new permissions', async () => {
      const permissions = Array(5)
        .fill(0)
        .map((v, i) => ({ action: `action-${i}` }));

      const createMany = jest.fn(() => Promise.resolve([]));
      const getSuperAdmin = jest.fn(() => Promise.resolve({ id: 0 }));
      const sendDidUpdateRolePermissions = jest.fn();
      const findMany = jest.fn(() => Promise.resolve([]));
      const values = jest.fn(() => permissions.map(perm => ({ actionId: perm.action })));
      const conditionProviderHas = jest.fn(cond => cond === 'cond');

      global.strapi = {
        admin: {
          services: {
            metrics: { sendDidUpdateRolePermissions },
            role: { getSuperAdmin },
            permission: {
              findMany,
              createMany,
              actionProvider: { values },
              conditionProvider: {
                has: conditionProviderHas,
                values: jest.fn(() => [{ id: 'admin::is-creator' }]),
              },
            },
          },
        },
      };

      const permissionsToAssign = [...permissions];
      permissionsToAssign[4] = {
        ...permissions[4],
        conditions: ['cond'],
      };

      await roleService.assignPermissions(1, permissionsToAssign);

      expect(createMany).toHaveBeenCalledTimes(1);
      expect(createMany).toHaveBeenCalledWith([
        { action: 'action-0', conditions: [], properties: {}, role: 1, subject: null },
        { action: 'action-1', conditions: [], properties: {}, role: 1, subject: null },
        { action: 'action-2', conditions: [], properties: {}, role: 1, subject: null },
        { action: 'action-3', conditions: [], properties: {}, role: 1, subject: null },
        { action: 'action-4', conditions: ['cond'], properties: {}, role: 1, subject: null },
      ]);
    });
  });

  describe('addPermissions', () => {
    test('Add role to permissions and call permissions service creation method', async () => {
      const createMany = jest.fn(() => []);
      const roleId = 1;
      const permissions = [
        {
          action: 'someAction',
          conditions: [],
          properties: { fields: null },
          subject: null,
        },
      ];

      const input = toPermission(permissions);

      const expected = permissions.map(permission => ({
        ...permission,
        role: roleId,
      }));

      global.strapi = {
        admin: {
          services: {
            permission: {
              createMany,
            },
            condition: { isValidCondition: () => true },
          },
        },
      };

      await roleService.addPermissions(roleId, input);

      expect(createMany).toHaveBeenCalledWith(expect.arrayContaining(expected));
    });
  });

  test('sanitizeRole removes users and permissions', () => {
    const role = {
      id: 1,
      name: 'Some Role',
      users: [{ id: 1 }],
      permissions: [{ id: 1 }],
    };

    expect(roleService.sanitizeRole(role)).toEqual({
      id: 1,
      name: 'Some Role',
    });
  });
});
