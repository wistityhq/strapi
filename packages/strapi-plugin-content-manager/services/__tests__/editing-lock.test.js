'use strict';

const editingLockService = require('../editing-lock');

describe('EditingLock', () => {
  describe('Collection type', () => {
    const fakeModel = {
      kind: 'collectionType',
    };
    const user = {
      id: 1234,
      firstname: 'Claire',
      lastname: 'Heitzler',
      username: null,
    };

    beforeEach(() => {
      global.strapi = {
        getModel: jest.fn(() => fakeModel),
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('getLock', async () => {
      const model = 'application::country.country';
      const entityId = 1234;
      const result = {
        isLockFree: true,
        lock: { uid: '123' },
      };
      const get = jest.fn(() => Promise.resolve(result));
      global.strapi.lockService = () => ({ get });

      const lockResult = await editingLockService.getLock({ model, entityId });
      expect(get).toHaveBeenCalledWith(`edit:${model}:${entityId}`);
      expect(lockResult).toBeDefined();
      expect(lockResult.isLockFree).toBe(result.isLockFree);
      expect(lockResult.lock).toEqual(result.lock);
    });

    test('setLock', async () => {
      const model = 'application::country.country';
      const entityId = 1;
      const result = {
        success: true,
        lock: { uid: '123' },
      };
      const metadata = { lastActivityDate: new Date() };
      const set = jest.fn(() => Promise.resolve(result));
      const get = jest.fn(() => Promise.resolve(result));
      global.strapi.lockService = () => ({ set, get });

      const lockResult = await editingLockService.setLock({ model, entityId, metadata, user });
      expect(set).toHaveBeenCalledWith(
        {
          key: `edit:${model}:${entityId}`,
          ttl: 30000,
          metadata: {
            lastActivityDate: metadata.lastActivityDate,
            lastUpdatedAt: expect.any(Number),
            lockedBy: user,
          },
        },
        { force: false }
      );
      expect(lockResult).toBeDefined();
      expect(lockResult.success).toBe(result.success);
      expect(lockResult.lock).toEqual(result.lock);
    });

    test('unlock', async () => {
      const model = 'application::country.country';
      const entityId = 1;
      const uid = 123;
      const result = {
        success: true,
        lock: { uid },
      };
      const extend = jest.fn(() => Promise.resolve(result));
      global.strapi.lockService = () => ({ extend });

      const lockResult = await editingLockService.unlock({ model, entityId, uid });
      expect(extend).toHaveBeenCalledWith({ key: `edit:${model}:${entityId}`, uid, ttl: 0 });
      expect(lockResult).toBeDefined();
      expect(lockResult.success).toBe(result.success);
      expect(lockResult.lock).toEqual(result.lock);
    });

    test('extendLock', async () => {
      const model = 'application::country.country';
      const entityId = 1;
      const uid = 123;
      const result = {
        success: true,
        lock: { uid },
      };
      const metadata = { lastActivityDate: new Date() };
      const extend = jest.fn(() => Promise.resolve(result));
      global.strapi.lockService = () => ({ extend });

      const lockResult = await editingLockService.extendLock({ model, entityId, uid, metadata });
      expect(extend).toHaveBeenCalledWith(
        {
          key: `edit:${model}:${entityId}`,
          uid,
          ttl: 30000,
          metadata: {
            lastActivityDate: metadata.lastActivityDate,
          },
        },
        { mergeMetadata: true }
      );
      expect(lockResult).toBeDefined();
      expect(lockResult.success).toBe(result.success);
      expect(lockResult.lock).toEqual(result.lock);
    });

    describe('validateAndExtendLock', () => {
      test('uid valid', async () => {
        const model = 'application::country.country';
        const entityId = 1;
        const uid = '123';
        const result = {
          success: true,
          lock: { uid },
        };
        const extend = jest.fn(() => Promise.resolve(result));
        global.strapi.lockService = () => ({ extend });

        await editingLockService.validateAndExtendLock({ model, uid, entityId });
        expect(extend).toHaveBeenCalledWith(
          {
            key: `edit:${model}:${entityId}`,
            uid,
            ttl: 30000,
          },
          { mergeMetadata: true }
        );
        expect(extend).toHaveBeenCalledTimes(1);
      });

      test('uid undefined', async () => {
        const model = 'application::country.country';
        const entityId = 1;
        const uid = undefined;
        const extend = jest.fn();
        const badRequest = jest.fn();
        global.strapi.lockService = () => ({ extend });
        global.strapi.errors = { badRequest };

        try {
          await editingLockService.validateAndExtendLock({ model, uid, entityId });
        } catch {
          // silence
        }

        expect(badRequest).toHaveBeenCalledTimes(1);
        expect(badRequest).toHaveBeenCalledWith('uid query param is invalid');
        expect(extend).toHaveBeenCalledTimes(0);
      });

      test('uid empty', async () => {
        const model = 'application::country.country';
        const entityId = 1;
        const uid = '';
        const extend = jest.fn();
        const badRequest = jest.fn();
        global.strapi.lockService = () => ({ extend });
        global.strapi.errors = { badRequest };

        try {
          await editingLockService.validateAndExtendLock({ model, uid, entityId });
        } catch {
          // silence
        }

        expect(badRequest).toHaveBeenCalledTimes(1);
        expect(badRequest).toHaveBeenCalledWith('uid query param is invalid');
        expect(extend).toHaveBeenCalledTimes(0);
      });

      test('lock unavailable', async () => {
        const model = 'application::country.country';
        const entityId = 1;
        const uid = '1234';
        const result = {
          success: false,
          lock: { uid },
        };
        const extend = jest.fn(() => Promise.resolve(result));
        const badRequest = jest.fn();
        global.strapi.lockService = () => ({ extend });
        global.strapi.errors = { badRequest };

        try {
          await editingLockService.validateAndExtendLock({ model, uid, entityId });
        } catch {
          // silence
        }

        expect(badRequest).toHaveBeenCalledTimes(1);
        expect(badRequest).toHaveBeenCalledWith('Someone took over the edition of this entry');
        expect(extend).toHaveBeenCalledTimes(1);
      });
    });
  });
});

describe('Single type', () => {
  const fakeModel = {
    kind: 'singleType',
  };
  const user = {
    id: 1234,
    firstname: 'Claire',
    lastname: 'Heitzler',
    username: null,
  };

  beforeEach(() => {
    global.strapi = {
      getModel: jest.fn(() => fakeModel),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getLock', async () => {
    const model = 'application::country.country';
    const result = {
      isLockFree: true,
      lock: { uid: '123' },
    };
    const get = jest.fn(() => Promise.resolve(result));
    global.strapi.lockService = () => ({ get });

    const lockResult = await editingLockService.getLock({ model });
    expect(get).toHaveBeenCalledWith(`edit:${model}`);
    expect(lockResult).toBeDefined();
    expect(lockResult.isLockFree).toBe(result.isLockFree);
    expect(lockResult.lock).toEqual(result.lock);
  });

  test('setLock', async () => {
    const model = 'application::country.country';
    const result = {
      success: true,
      lock: { uid: '123' },
    };
    const metadata = { lastActivityDate: new Date() };
    const set = jest.fn(() => Promise.resolve(result));
    const get = jest.fn(() => Promise.resolve(result));
    global.strapi.lockService = () => ({ set, get });

    const lockResult = await editingLockService.setLock({ model, metadata, user });
    expect(set).toHaveBeenCalledWith(
      {
        key: `edit:${model}`,
        ttl: 30000,
        metadata: {
          lastActivityDate: metadata.lastActivityDate,
          lastUpdatedAt: expect.any(Number),
          lockedBy: user,
        },
      },
      { force: false }
    );
    expect(lockResult).toBeDefined();
    expect(lockResult.success).toBe(result.success);
    expect(lockResult.lock).toEqual(result.lock);
  });

  test('unlock', async () => {
    const model = 'application::country.country';
    const uid = 123;
    const result = {
      success: true,
      lock: { uid },
    };
    const extend = jest.fn(() => Promise.resolve(result));
    global.strapi.lockService = () => ({ extend });

    const lockResult = await editingLockService.unlock({ model, uid });
    expect(extend).toHaveBeenCalledWith({ key: `edit:${model}`, uid, ttl: 0 });
    expect(lockResult).toBeDefined();
    expect(lockResult.success).toBe(result.success);
    expect(lockResult.lock).toEqual(result.lock);
  });

  test('extendLock', async () => {
    const model = 'application::country.country';
    const uid = 123;
    const result = {
      success: true,
      lock: { uid },
    };
    const metadata = { lastActivityDate: new Date() };
    const extend = jest.fn(() => Promise.resolve(result));
    global.strapi.lockService = () => ({ extend });

    const lockResult = await editingLockService.extendLock({ model, uid, metadata });
    expect(extend).toHaveBeenCalledWith(
      {
        key: `edit:${model}`,
        uid,
        ttl: 30000,
        metadata: {
          lastActivityDate: metadata.lastActivityDate,
        },
      },
      { mergeMetadata: true }
    );
    expect(lockResult).toBeDefined();
    expect(lockResult.success).toBe(result.success);
    expect(lockResult.lock).toEqual(result.lock);
  });

  test('registerLockHook', async () => {
    const on = jest.fn();
    global.strapi.eventHub = { on };

    await editingLockService.registerLockHook();

    expect(on).toHaveBeenCalledTimes(2);
    expect(on).toHaveBeenNthCalledWith(1, 'entry.update', expect.any(Function));
    expect(on).toHaveBeenNthCalledWith(2, 'entry.create', expect.any(Function));
  });

  describe('validateAndExtendLock', () => {
    test('uid valid', async () => {
      const model = 'application::country.country';
      const uid = '123';
      const result = {
        success: true,
        lock: { uid },
      };
      const extend = jest.fn(() => Promise.resolve(result));
      global.strapi.lockService = () => ({ extend });

      await editingLockService.validateAndExtendLock({ model, uid });
      expect(extend).toHaveBeenCalledWith(
        {
          key: `edit:${model}`,
          uid,
          ttl: 30000,
        },
        { mergeMetadata: true }
      );
      expect(extend).toHaveBeenCalledTimes(1);
    });

    test('uid undefined', async () => {
      const model = 'application::country.country';
      const uid = undefined;
      const extend = jest.fn();
      const badRequest = jest.fn();
      global.strapi.lockService = () => ({ extend });
      global.strapi.errors = { badRequest };

      try {
        await editingLockService.validateAndExtendLock({ model, uid });
      } catch {
        // silence
      }

      expect(badRequest).toHaveBeenCalledTimes(1);
      expect(badRequest).toHaveBeenCalledWith('uid query param is invalid');
      expect(extend).toHaveBeenCalledTimes(0);
    });

    test('uid empty', async () => {
      const model = 'application::country.country';
      const uid = '';
      const extend = jest.fn();
      const badRequest = jest.fn();
      global.strapi.lockService = () => ({ extend });
      global.strapi.errors = { badRequest };

      try {
        await editingLockService.validateAndExtendLock({ model, uid });
      } catch {
        // silence
      }

      expect(badRequest).toHaveBeenCalledTimes(1);
      expect(badRequest).toHaveBeenCalledWith('uid query param is invalid');
      expect(extend).toHaveBeenCalledTimes(0);
    });

    test('lock unavailable', async () => {
      const model = 'application::country.country';
      const uid = '1234';
      const result = {
        success: false,
        lock: { uid },
      };
      const extend = jest.fn(() => Promise.resolve(result));
      const badRequest = jest.fn();
      global.strapi.lockService = () => ({ extend });
      global.strapi.errors = { badRequest };

      try {
        await editingLockService.validateAndExtendLock({ model, uid });
      } catch {
        // silence
      }

      expect(badRequest).toHaveBeenCalledTimes(1);
      expect(badRequest).toHaveBeenCalledWith('Someone took over the edition of this entry');
      expect(extend).toHaveBeenCalledTimes(1);
    });
  });
});
