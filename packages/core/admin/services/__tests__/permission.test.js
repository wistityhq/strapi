'use strict';

const _ = require('lodash');
const { merge } = require('lodash/fp');
const permissionService = require('../permission');
const { toPermission } = require('../../domain/permission');

describe('Permission Service', () => {
  beforeEach(() => {
    global.strapi = {
      admin: {
        services: {
          condition: {
            isValidCondition() {
              return true;
            },
          },
        },
      },
    };
  });

  describe('Find permissions', () => {
    test('Find calls the right db query', async () => {
      const findMany = jest.fn(() => Promise.resolve([]));
      global.strapi = merge(global.strapi, {
        query() {
          return { findMany };
        },
      });

      await permissionService.findMany({ where: { role: { id: 1 } } });

      expect(findMany).toHaveBeenCalledWith({ where: { role: { id: 1 } } });
    });
  });

  describe('Find User Permissions', () => {
    test('Find calls the right db query', async () => {
      const findMany = jest.fn(() => Promise.resolve([]));

      global.strapi = merge(global.strapi, {
        query() {
          return { findMany };
        },
      });

      await permissionService.findUserPermissions({
        id: 1,
      });

      expect(findMany).toHaveBeenCalledWith({ where: { role: { users: { id: 1 } } } });
    });
  });

  describe('Sanitize Permission', () => {
    test('Removes unwanted properties', () => {
      const isValidCondition = jest.fn(condition => ['cond'].includes(condition));

      global.strapi = merge(global.strapi, {
        admin: { services: { condition: { isValidCondition } } },
      });

      const permission = {
        action: 'read',
        subject: 'article',
        properties: { fields: ['*'] },
        conditions: ['cond'],
        foo: 'bar',
      };

      const sanitizedPermission = permissionService.sanitizePermission(permission);

      expect(sanitizedPermission.foo).toBeUndefined();
      expect(sanitizedPermission).toMatchObject({
        ..._.omit(permission, 'foo'),
      });
    });
  });

  describe('cleanPermissionsInDatabase', () => {
    test('Remove permission that dont exist + clean fields', async () => {
      const permsInDb = [
        {
          id: 1,
          action: 'action-1',
          properties: { fields: ['name'] },
        },
        {
          id: 2,
          action: 'action-2',
          properties: { fields: ['name'] },
        },
        {
          id: 3,
          action: 'action-3',
          subject: 'country',
          properties: { fields: ['name'] },
        },
        {
          id: 4,
          action: 'action-3',
          subject: 'planet',
          properties: { fields: ['name'] },
        },
        {
          id: 5,
          action: 'action-1',
          subject: 'planet',
          properties: { fields: ['name', 'description'] },
        },
        {
          id: 6,
          action: 'action-1',
          subject: 'country',
          properties: { fields: null },
        },
      ];

      const permsWithCleanFields = [
        permsInDb[0],
        permsInDb[2],
        { ...permsInDb[4], properties: { fields: ['name', 'galaxy'] } },
        { ...permsInDb[5], properties: { fields: ['name'] } },
      ].map(p => ({ ...p, conditions: [] }));

      const findMany = jest.fn(() => Promise.resolve(permsInDb));

      const cleanPermissionFields = jest.fn(() => toPermission(permsWithCleanFields));
      const dbDelete = jest.fn(() => Promise.resolve());
      const update = jest.fn(() => Promise.resolve());
      const count = jest.fn(() => Promise.resolve(4));

      const registeredPerms = new Map();
      registeredPerms.set('action-1', {});
      registeredPerms.set('action-3', { subjects: ['country'] });

      global.strapi = merge(global.strapi, {
        query: () => ({ findMany, delete: dbDelete, update, count }),
        admin: {
          services: {
            'content-type': { cleanPermissionFields },
            permission: {
              actionProvider: {
                has: jest.fn(id => registeredPerms.has(id)),
                get: jest.fn(id => registeredPerms.get(id)),
              },
            },
          },
        },
      });

      await permissionService.cleanPermissionsInDatabase();

      expect(findMany).toHaveBeenCalledWith({ limit: 200, offset: 0 });
      expect(update).toHaveBeenNthCalledWith(1, {
        where: { id: permsInDb[4].id },
        data: permsWithCleanFields[2],
      });

      expect(update).toHaveBeenNthCalledWith(2, {
        where: { id: permsInDb[5].id },
        data: permsWithCleanFields[3],
      });
      expect(dbDelete).toHaveBeenNthCalledWith(1, { where: { id: 2 } });
      expect(dbDelete).toHaveBeenNthCalledWith(2, { where: { id: 4 } });
    });
  });
});
