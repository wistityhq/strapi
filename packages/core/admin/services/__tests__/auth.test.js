'use strict';

const _ = require('lodash');

const {
  validatePassword,
  hashPassword,
  checkCredentials,
  forgotPassword,
  resetPassword,
} = require('../auth');

describe('Auth', () => {
  describe('checkCredentials', () => {
    test('Fails on not found user, without leaking not found info', async () => {
      const findOne = jest.fn(() => Promise.resolve());

      global.strapi = {
        query() {
          return { findOne };
        },
      };

      const input = { email: 'test@strapi.io', password: 'pcw123' };
      const res = await checkCredentials(input);

      expect(findOne).toHaveBeenCalledWith({ where: { email: input.email } });
      expect(res).toEqual([null, false, { message: 'Invalid credentials' }]);
    });

    test('Fails when password is invalid, without leaking specific info', async () => {
      const user = {
        id: 1,
        firstname: '',
        lastname: '',
        email: 'test@strapi.io',
        password: await hashPassword('test-password'),
      };

      const findOne = jest.fn(() => Promise.resolve(user));

      global.strapi = {
        query() {
          return { findOne };
        },
      };

      const input = { email: 'test@strapi.io', password: 'wrong-password' };
      const res = await checkCredentials(input);

      expect(findOne).toHaveBeenCalledWith({ where: { email: input.email } });
      expect(res).toEqual([null, false, { message: 'Invalid credentials' }]);
    });

    test.each([false, null, 1, 0])('Fails when user is not active (%s)', async isActive => {
      const user = {
        id: 1,
        firstname: '',
        lastname: '',
        email: 'test@strapi.io',
        isActive,
        password: await hashPassword('test-password'),
      };

      const findOne = jest.fn(() => Promise.resolve(user));

      global.strapi = {
        query() {
          return { findOne };
        },
      };

      const input = { email: 'test@strapi.io', password: 'test-password' };
      const res = await checkCredentials(input);

      expect(findOne).toHaveBeenCalledWith({ where: { email: input.email } });
      expect(res).toEqual([null, false, { message: 'User not active' }]);
    });

    test('Returns user when all checks pass', async () => {
      const user = {
        id: 1,
        firstname: '',
        lastname: '',
        email: 'test@strapi.io',
        isActive: true,
        password: await hashPassword('test-password'),
      };

      const findOne = jest.fn(() => Promise.resolve(user));

      global.strapi = {
        query() {
          return { findOne };
        },
      };

      const input = { email: 'test@strapi.io', password: 'test-password' };
      const res = await checkCredentials(input);

      expect(findOne).toHaveBeenCalledWith({ where: { email: input.email } });
      expect(res).toEqual([null, user]);
    });
  });

  describe('validatePassword', () => {
    test('Compares password with hash', async () => {
      const password = 'pcw123';
      const hash = await hashPassword(password);

      const isValid = await validatePassword(password, hash);
      expect(isValid).toBe(true);
    });
  });

  describe('forgotPassword', () => {
    test('Only run the process for active users', async () => {
      const findOne = jest.fn(() => Promise.resolve());

      global.strapi = {
        query() {
          return { findOne };
        },
      };

      const input = { email: 'test@strapi.io' };
      await forgotPassword(input);

      expect(findOne).toHaveBeenCalledWith({ where: { email: input.email, isActive: true } });
    });

    test('Will return silently in case the user is not found', async () => {
      const findOne = jest.fn(() => Promise.resolve());
      const send = jest.fn(() => Promise.resolve());

      global.strapi = {
        query() {
          return { findOne };
        },
        plugins: {
          email: {
            services: {
              email: { send },
            },
          },
        },
      };

      const input = { email: 'test@strapi.io' };
      await forgotPassword(input);

      expect(findOne).toHaveBeenCalled();
      expect(send).not.toHaveBeenCalled();
    });

    test('Will assign a new reset token', async () => {
      const user = {
        id: 1,
        email: 'test@strapi.io',
      };
      const resetPasswordToken = '123';

      const findOne = jest.fn(() => Promise.resolve(user));
      const send = jest.fn(() => Promise.resolve());
      const updateById = jest.fn(() => Promise.resolve());
      const createToken = jest.fn(() => resetPasswordToken);

      const config = {
        server: {
          host: '0.0.0.0',
        },
        admin: { url: '/admin' },
      };

      global.strapi = {
        config: {
          ...config,
          get(path, def) {
            return _.get(path, def);
          },
        },
        query() {
          return { findOne };
        },
        admin: { services: { user: { updateById }, token: { createToken } } },
        plugins: { email: { services: { email: { send, sendTemplatedEmail: send } } } },
      };

      const input = { email: user.email };
      await forgotPassword(input);

      expect(findOne).toHaveBeenCalled();
      expect(createToken).toHaveBeenCalled();
      expect(updateById).toHaveBeenCalledWith(user.id, { resetPasswordToken });
    });

    test('Will call the send service', async () => {
      const user = {
        id: 1,
        email: 'test@strapi.io',
      };
      const resetPasswordToken = '123';

      const findOne = jest.fn(() => Promise.resolve(user));
      const send = jest.fn(() => Promise.resolve());
      const sendTemplatedEmail = jest.fn(() => Promise.resolve());
      const updateById = jest.fn(() => Promise.resolve());
      const createToken = jest.fn(() => resetPasswordToken);

      const config = {
        server: {
          host: '0.0.0.0',
          admin: { url: '/admin', forgotPassword: { emailTemplate: {} } },
        },
      };

      global.strapi = {
        config: {
          ...config,
          get(path, def) {
            return _.get(path, def);
          },
        },
        query() {
          return { findOne };
        },
        admin: {
          services: {
            user: { updateById },
            token: { createToken },
          },
        },
        plugins: { email: { services: { email: { send, sendTemplatedEmail } } } },
      };

      const input = { email: user.email };
      await forgotPassword(input);

      expect(findOne).toHaveBeenCalled();
      expect(createToken).toHaveBeenCalled();
      expect(sendTemplatedEmail).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    test('Check user is active', async () => {
      const resetPasswordToken = '123';
      const findOne = jest.fn(() => Promise.resolve());
      const badRequest = jest.fn(() => {});

      global.strapi = {
        query() {
          return { findOne };
        },
        errors: { badRequest },
      };

      expect.assertions(2);
      return resetPassword({ resetPasswordToken, password: 'Test1234' }).catch(() => {
        expect(findOne).toHaveBeenCalledWith({ where: { resetPasswordToken, isActive: true } });
        expect(badRequest).toHaveBeenCalled();
      });
    });

    test('Fails if user is not found', async () => {
      const resetPasswordToken = '123';
      const findOne = jest.fn(() => Promise.resolve());
      const badRequest = jest.fn(() => {});

      global.strapi = {
        query() {
          return { findOne };
        },
        errors: { badRequest },
      };

      expect.assertions(1);
      return resetPassword({ resetPasswordToken, password: 'Test1234' }).catch(() => {
        expect(badRequest).toHaveBeenCalled();
      });
    });

    test('Changes password and clear reset token', async () => {
      const resetPasswordToken = '123';
      const user = { id: 1 };

      const findOne = jest.fn(() => Promise.resolve(user));
      const updateById = jest.fn(() => Promise.resolve());

      global.strapi = {
        query() {
          return { findOne };
        },
        admin: { services: { user: { updateById } } },
      };

      const input = { resetPasswordToken, password: 'Test1234' };
      await resetPassword(input);

      expect(updateById).toHaveBeenCalledWith(user.id, {
        password: input.password,
        resetPasswordToken: null,
      });
    });
  });
});
