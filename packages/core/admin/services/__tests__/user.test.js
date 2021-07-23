'use strict';

const _ = require('lodash');
const userService = require('../user');
const { SUPER_ADMIN_CODE } = require('../constants');

describe('User', () => {
  describe('sanitizeUser', () => {
    test('Removes password and resetPasswordToken', () => {
      const res = userService.sanitizeUser({
        id: 1,
        firstname: 'Test',
        otherField: 'Hello',
        password: '$5IAZUDB871',
        resetPasswordToken: '3456-5678-6789-789',
        roles: [],
      });

      expect(res).toEqual({
        id: 1,
        firstname: 'Test',
        otherField: 'Hello',
        roles: [],
      });
    });
  });

  describe('create', () => {
    const count = jest.fn(() => Promise.resolve(1));
    const sendDidInviteUser = jest.fn();

    test('Creates a user by merging given and default attributes', async () => {
      const create = jest.fn(({ data }) => Promise.resolve(data));
      const createToken = jest.fn(() => 'token');
      const hashPassword = jest.fn(() => Promise.resolve('123456789'));

      global.strapi = {
        admin: {
          services: {
            token: { createToken },
            auth: { hashPassword },
            role: { count },
            metrics: { sendDidInviteUser },
          },
        },
        query() {
          return { create, count };
        },
      };

      const input = { firstname: 'Kai', lastname: 'Doe', email: 'kaidoe@email.com' };
      const expected = { ...input, isActive: false, roles: [], registrationToken: 'token' };

      const result = await userService.create(input);

      expect(create).toHaveBeenCalled();
      expect(createToken).toHaveBeenCalled();
      expect(result).toMatchObject(expected);
    });

    test('Creates a user and hash password if provided', async () => {
      const create = jest.fn(({ data }) => Promise.resolve(data));
      const createToken = jest.fn(() => 'token');
      const hashPassword = jest.fn(() => Promise.resolve('123456789'));

      global.strapi = {
        admin: {
          services: {
            token: { createToken },
            auth: { hashPassword },
            role: { count },
            metrics: { sendDidInviteUser },
          },
        },
        query() {
          return { create, count };
        },
      };

      const input = {
        firstname: 'Kai',
        lastname: 'Doe',
        email: 'kaidoe@email.com',
        password: 'Pcw123',
      };
      const expected = {
        ...input,
        password: expect.any(String),
        isActive: false,
        roles: [],
        registrationToken: 'token',
      };

      const result = await userService.create(input);

      expect(create).toHaveBeenCalled();
      expect(hashPassword).toHaveBeenCalledWith(input.password);
      expect(createToken).toHaveBeenCalled();
      expect(result).toMatchObject(expected);
      expect(result.password !== input.password).toBe(true);
    });

    test('Creates a user by using given attributes', async () => {
      const create = jest.fn(({ data }) => Promise.resolve(data));
      const createToken = jest.fn(() => 'token');
      const hashPassword = jest.fn(() => Promise.resolve('123456789'));

      global.strapi = {
        admin: {
          services: {
            token: { createToken },
            auth: { hashPassword },
            role: { count },
            metrics: { sendDidInviteUser },
          },
        },
        query() {
          return { create, count };
        },
      };

      const input = {
        firstname: 'Kai',
        lastname: 'Doe',
        email: 'kaidoe@email.com',
        roles: [2],
        isActive: true,
        registrationToken: 'another-token',
      };
      const expected = _.clone(input);
      const result = await userService.create(input);

      expect(result).toMatchObject(expected);
    });
  });

  describe('Count users', () => {
    test('Count users without params', async () => {
      const count = jest.fn(() => Promise.resolve(2));
      global.strapi = {
        query: () => ({ count }),
      };

      const amount = await userService.count();

      expect(amount).toBe(2);
      expect(count).toHaveBeenCalledWith({ where: {} });
    });

    test('Count users with params', async () => {
      const count = jest.fn(() => Promise.resolve(2));
      global.strapi = {
        query: () => ({ count }),
      };

      const params = { foo: 'bar' };
      const amount = await userService.count(params);

      expect(amount).toBe(2);
      expect(count).toHaveBeenCalledWith({ where: params });
    });
  });

  describe('update', () => {
    test('Hash password', async () => {
      const hash = 'aoizdnoaizndoainzodiaz';

      const id = 1;
      const input = { email: 'test@strapi.io', password: '123' };

      const findOne = jest.fn((_, user) => Promise.resolve(user));
      const update = jest.fn(({ data }) => Promise.resolve(data));
      const hashPassword = jest.fn(() => Promise.resolve(hash));

      global.strapi = {
        query() {
          return { update, findOne };
        },
        admin: {
          services: {
            auth: { hashPassword },
          },
        },
      };

      const result = await userService.updateById(id, input);

      expect(hashPassword).toHaveBeenCalledWith(input.password);
      expect(update).toHaveBeenCalledWith({
        where: { id },
        data: { email: input.email, password: hash },
      });

      expect(result).toEqual({
        email: 'test@strapi.io',
        password: 'aoizdnoaizndoainzodiaz',
      });
    });

    test('Forwards call to the query layer', async () => {
      const user = {
        email: 'test@strapi.io',
      };

      const findOne = jest.fn(() => Promise.resolve(user));
      const update = jest.fn(() => Promise.resolve(user));

      global.strapi = {
        query() {
          return { update, findOne };
        },
      };
      const id = 1;
      const input = { email: 'test@strapi.io' };
      const result = await userService.updateById(id, input);

      expect(update).toHaveBeenCalledWith({ where: { id }, data: input });
      expect(result).toBe(user);
    });

    test('Call the update function with the expected params', async () => {
      const email = 'email@email.fr';
      const password = 'Testing1234';
      const hash = 'hash';
      const userId = 1;

      const findOne = jest.fn(() => ({ id: userId }));
      const update = jest.fn();
      const hashPassword = jest.fn(() => hash);

      global.strapi = {
        query() {
          return {
            findOne,
            update,
          };
        },
        admin: {
          services: {
            auth: {
              hashPassword,
            },
          },
        },
      };

      await userService.resetPasswordByEmail(email, password);
      expect(findOne).toHaveBeenCalledWith({ where: { email } });
      expect(update).toHaveBeenCalledWith({ where: { id: userId }, data: { password: hash } });
      expect(hashPassword).toHaveBeenCalledWith(password);
    });
  });

  describe('updateById', () => {
    test('Cannot delete last super admin', async () => {
      const findOne = jest.fn(() =>
        Promise.resolve({ id: 11, roles: [{ code: SUPER_ADMIN_CODE }] })
      );

      const getSuperAdminWithUsersCount = jest.fn(() => Promise.resolve({ id: 1, usersCount: 1 }));
      const badRequest = jest.fn();

      global.strapi = {
        query: () => ({ findOne }),
        admin: { services: { role: { getSuperAdminWithUsersCount } } },
        errors: { badRequest },
      };

      try {
        await userService.deleteById(2);
      } catch (e) {
        //nothing
      }

      expect(badRequest).toHaveBeenCalledWith(
        'ValidationError',
        'You must have at least one user with super admin role.'
      );
    });

    test('Can delete a super admin if he/she is not the last one', async () => {
      const user = { id: 2, roles: [{ code: SUPER_ADMIN_CODE }] };
      const findOne = jest.fn(() => Promise.resolve(user));
      const getSuperAdminWithUsersCount = jest.fn(() => Promise.resolve({ id: 1, usersCount: 2 }));
      const deleteFn = jest.fn(() => user);

      global.strapi = {
        query: () => ({ findOne, delete: deleteFn }),
        admin: { services: { role: { getSuperAdminWithUsersCount } } },
      };

      const res = await userService.deleteById(user.id);

      expect(deleteFn).toHaveBeenCalledWith({ where: { id: user.id } });
      expect(res).toEqual(user);
    });
  });

  describe('deleteByIds', () => {
    test('Cannot delete last super admin', async () => {
      const count = jest.fn(() => Promise.resolve(2));
      const getSuperAdminWithUsersCount = jest.fn(() => Promise.resolve({ id: 1, usersCount: 2 }));
      const badRequest = jest.fn();
      global.strapi = {
        query: () => ({ count }),
        admin: { services: { role: { getSuperAdminWithUsersCount } } },
        errors: { badRequest },
      };

      try {
        await userService.deleteByIds([2, 3]);
      } catch (e) {
        // nothing
      }

      expect(badRequest).toHaveBeenCalledWith(
        'ValidationError',
        'You must have at least one user with super admin role.'
      );
    });

    test('Can delete a super admin if he/she is not the last one', async () => {
      const users = [{ id: 2 }, { id: 3 }];
      const count = jest.fn(() => Promise.resolve(users.length));
      const getSuperAdminWithUsersCount = jest.fn(() => Promise.resolve({ id: 1, usersCount: 3 }));
      const deleteFn = jest
        .fn()
        .mockImplementationOnce(() => users[0])
        .mockImplementationOnce(() => users[1]);

      global.strapi = {
        query: () => ({ count, delete: deleteFn }),
        admin: { services: { role: { getSuperAdminWithUsersCount } } },
      };

      const res = await userService.deleteByIds([2, 3]);

      console.log({ res });

      expect(deleteFn).toHaveBeenNthCalledWith(1, { where: { id: 2 } });
      expect(deleteFn).toHaveBeenNthCalledWith(2, { where: { id: 3 } });

      expect(res).toEqual(users);
    });
  });

  describe('exists', () => {
    test('Return true if the user already exists', async () => {
      const count = jest.fn(() => Promise.resolve(1));

      global.strapi = {
        query: () => {
          return { count };
        },
      };

      const result = await userService.exists();

      expect(result).toBeTruthy();
    });

    test('Return false if the user does not exists', async () => {
      const count = jest.fn(() => Promise.resolve(0));

      global.strapi = {
        query: () => {
          return { count };
        },
      };

      const result = await userService.exists();

      expect(result).toBeFalsy();
    });
  });

  describe('Fetch users (paginated)', () => {
    const defaults = { page: 1, pageSize: 100 };

    beforeEach(() => {
      const fetchPage = jest.fn(({ page = defaults.page, pageSize = defaults.pageSize } = {}) => {
        return {
          results: Array.from({ length: pageSize }).map((_, i) => i + (page - 1) * pageSize),
          pagination: { page, pageSize, total: page * pageSize, pageCount: page },
        };
      });

      global.strapi = {
        query() {
          return { findPage: fetchPage, searchPage: fetchPage };
        },
      };
    });

    test('Fetch users with custom pagination', async () => {
      const pagination = { page: 2, pageSize: 15 };
      const foundPage = await userService.findPage(pagination);
      const searchedPage = await userService.searchPage(pagination);

      expect(foundPage.results.length).toBe(15);
      expect(foundPage.results[0]).toBe(15);
      expect((foundPage.pagination.total = 30));

      expect(searchedPage.results.length).toBe(15);
      expect(searchedPage.results[0]).toBe(15);
      expect((searchedPage.pagination.total = 30));
    });

    test('Fetch users with default pagination', async () => {
      const foundPage = await userService.findPage();
      const searchedPage = await userService.searchPage();

      expect(foundPage.results.length).toBe(100);
      expect(foundPage.results[0]).toBe(0);
      expect((foundPage.pagination.total = 100));

      expect(searchedPage.results.length).toBe(100);
      expect(searchedPage.results[0]).toBe(0);
      expect((searchedPage.pagination.total = 100));
    });

    test('Fetch users with partial pagination', async () => {
      const pagination = { page: 2 };
      const foundPage = await userService.findPage(pagination);
      const searchedPage = await userService.searchPage(pagination);

      expect(foundPage.results.length).toBe(100);
      expect(foundPage.results[0]).toBe(100);
      expect((foundPage.pagination.total = 200));

      expect(searchedPage.results.length).toBe(100);
      expect(searchedPage.results[0]).toBe(100);
      expect((searchedPage.pagination.total = 200));
    });
  });

  describe('Fetch user', () => {
    const user = { firstname: 'Kai', lastname: 'Doe', email: 'kaidoe@email.com' };

    beforeEach(() => {
      const findOne = jest.fn(({ where: { id } }) =>
        Promise.resolve(
          {
            1: user,
          }[id] || null
        )
      );

      global.strapi = {
        query() {
          return { findOne };
        },
      };
    });

    test('Finds and returns a user by its ID', async () => {
      const input = { id: 1 };
      const res = await userService.findOne(input);

      expect(res).not.toBeNull();
      expect(res).toMatchObject(user);
    });

    test('Fails to find a user with provided params', async () => {
      const input = { id: 27 };
      const res = await userService.findOne(input);

      expect(res).toBeNull();
    });
  });

  describe('findRegistrationInfo', () => {
    test('Returns undefined if not found', async () => {
      const findOne = jest.fn(() => Promise.resolve());

      global.strapi = {
        query: () => {
          return { findOne };
        },
      };

      const res = await userService.findRegistrationInfo('ABCD');
      expect(res).toBeUndefined();
      expect(findOne).toHaveBeenCalledWith({ where: { registrationToken: 'ABCD' } });
    });

    test('Returns correct user registration info', async () => {
      const user = {
        email: 'test@strapi.io',
        firstname: 'Test',
        lastname: 'Strapi',
        otherField: 'ignored',
      };

      const findOne = jest.fn(() => Promise.resolve(user));

      global.strapi = {
        query: () => {
          return { findOne };
        },
      };

      const res = await userService.findRegistrationInfo('ABCD');

      expect(res).toEqual({
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
      });
    });
  });

  describe('register', () => {
    test('Fails if no matching user is found', async () => {
      const findOne = jest.fn(() => Promise.resolve(undefined));

      global.strapi = {
        query() {
          return {
            findOne,
          };
        },
        errors: {
          badRequest(msg) {
            throw new Error(msg);
          },
        },
      };

      const input = {
        registrationToken: '123',
        userInfo: {
          firstname: 'test',
          lastname: 'Strapi',
          password: 'Test1234',
        },
      };

      expect(userService.register(input)).rejects.toThrowError('Invalid registration info');
    });

    test('Calls udpate service', async () => {
      const findOne = jest.fn(() => Promise.resolve({ id: 1 }));
      const updateById = jest.fn(user => Promise.resolve(user));

      global.strapi = {
        query() {
          return {
            findOne,
          };
        },
        admin: {
          services: {
            user: { updateById },
          },
        },
      };

      const input = {
        registrationToken: '123',
        userInfo: {
          firstname: 'test',
          lastname: 'Strapi',
          password: 'Test1234',
        },
      };

      await userService.register(input);

      expect(updateById).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ firstname: 'test', lastname: 'Strapi', password: 'Test1234' })
      );
    });

    test('Set user to active', async () => {
      const findOne = jest.fn(() => Promise.resolve({ id: 1 }));
      const updateById = jest.fn(user => Promise.resolve(user));

      global.strapi = {
        query() {
          return {
            findOne,
          };
        },
        admin: {
          services: {
            user: { updateById },
          },
        },
      };

      const input = {
        registrationToken: '123',
        userInfo: {
          firstname: 'test',
          lastname: 'Strapi',
          password: 'Test1234',
        },
      };

      await userService.register(input);

      expect(updateById).toHaveBeenCalledWith(1, expect.objectContaining({ isActive: true }));
    });

    test('Reset registrationToken', async () => {
      const findOne = jest.fn(() => Promise.resolve({ id: 1 }));
      const updateById = jest.fn(user => Promise.resolve(user));

      global.strapi = {
        query() {
          return {
            findOne,
          };
        },
        admin: {
          services: {
            user: { updateById },
          },
        },
      };

      const input = {
        registrationToken: '123',
        userInfo: {
          firstname: 'test',
          lastname: 'Strapi',
          password: 'Test1234',
        },
      };

      await userService.register(input);

      expect(updateById).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ registrationToken: null })
      );
    });
  });

  test.todo('Assign a role to all');

  describe('displayWarningIfUsersDontHaveRole', () => {
    test('All users have at least one role', async () => {
      const count = jest.fn(() => Promise.resolve(0));
      const warn = jest.fn();

      global.strapi = {
        query: () => ({ model: { orm: 'bookshelf' }, count }),
        log: { warn },
      };

      await userService.displayWarningIfUsersDontHaveRole();

      expect(warn).toHaveBeenCalledTimes(0);
    });

    test('2 users have 0 roles', async () => {
      const count = jest.fn(() => Promise.resolve(2));
      const warn = jest.fn();

      global.strapi = {
        query: () => ({ model: { orm: 'bookshelf' }, count }),
        log: { warn },
      };

      await userService.displayWarningIfUsersDontHaveRole();

      expect(warn).toHaveBeenCalledWith("Some users (2) don't have any role.");
    });
  });

  describe('resetPasswordByEmail', () => {
    test('Throws on missing user', async () => {
      const email = 'email@email.fr';
      const password = 'invalidpass';

      const findOne = jest.fn(() => {
        return null;
      });

      global.strapi = {
        query() {
          return {
            findOne,
          };
        },
      };

      await expect(userService.resetPasswordByEmail(email, password)).rejects.toEqual(
        new Error(`User not found for email: ${email}`)
      );

      expect(findOne).toHaveBeenCalledWith({ where: { email } });
    });

    test.each(['abc', 'Abcd', 'Abcdefgh', 'Abcd123'])(
      'Throws on invalid password',
      async password => {
        const email = 'email@email.fr';

        const findOne = jest.fn(() => ({ id: 1 }));

        global.strapi = {
          query() {
            return {
              findOne,
            };
          },
        };

        await expect(userService.resetPasswordByEmail(email, password)).rejects.toEqual(
          new Error(
            'Invalid password. Expected a minimum of 8 characters with at least one number and one uppercase letter'
          )
        );

        expect(findOne).toHaveBeenCalledWith({ where: { email } });
      }
    );
  });
});
