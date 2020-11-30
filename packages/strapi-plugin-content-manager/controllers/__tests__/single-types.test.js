'use strict';

const createContext = require('../../../../test/helpers/create-context');
const singleTypes = require('../single-types');

describe('Single Types', () => {
  test('Successfull find', async () => {
    const state = {
      userAbility: {
        can: jest.fn(),
        cannot: jest.fn(() => false),
      },
    };

    const notFound = jest.fn();
    const createPermissionsManager = jest.fn(() => ({
      ability: state.userAbility,
    }));

    const permissionChecker = {
      cannot: {
        read: jest.fn(() => false),
        create: jest.fn(() => false),
      },
    };

    global.strapi = {
      admin: {
        services: {
          permission: {
            createPermissionsManager,
          },
        },
      },
      plugins: {
        'content-manager': {
          services: {
            'entity-manager': {
              find() {
                return Promise.resolve();
              },
              assocCreatorRoles(entity) {
                return entity;
              },
            },
            'permission-checker': {
              create() {
                return permissionChecker;
              },
            },
          },
        },
      },
      entityService: {
        find: jest.fn(),
      },
    };

    const modelUid = 'test-model';

    const ctx = createContext(
      {
        params: {
          model: modelUid,
        },
      },
      { state, notFound }
    );

    await singleTypes.find(ctx);

    expect(permissionChecker.cannot.read).toHaveBeenCalled();
    expect(permissionChecker.cannot.create).toHaveBeenCalled();
    expect(notFound).toHaveBeenCalled();
  });

  test('Successfull create', async () => {
    const modelUid = 'test-uid';

    const state = {
      userAbility: {
        can: jest.fn(),
        cannot: jest.fn(() => false),
      },
      user: {
        id: 1,
      },
    };

    const createPermissionsManager = jest.fn(() => ({
      ability: state.userAbility,
    }));

    const permissionChecker = {
      cannot: {
        update: jest.fn(() => false),
        create: jest.fn(() => false),
      },
      sanitizeCreateInput: obj => obj,
      sanitizeOutput: obj => obj,
    };

    const createFn = jest.fn(() => ({}));
    const sendTelemetry = jest.fn(() => ({}));
    const setLock = jest.fn(() => ({ lock: { uid: '123' } }));
    const unlock = jest.fn();

    global.strapi = {
      admin: {
        services: {
          permission: {
            createPermissionsManager,
          },
        },
      },
      getModel() {
        return {
          options: {
            draftAndPublish: true,
          },
          attributes: {
            title: {
              type: 'string',
            },
          },
        };
      },
      plugins: {
        'content-manager': {
          services: {
            'entity-manager': {
              find() {
                return Promise.resolve();
              },
              assocCreatorRoles: entity => entity,
              create: createFn,
            },
            'permission-checker': {
              create: () => permissionChecker,
            },
            'editing-lock': { setLock, unlock },
          },
        },
      },
      entityService: {
        find: jest.fn(),
      },
      telemetry: {
        send: sendTelemetry,
      },
    };

    const ctx = createContext(
      {
        params: {
          model: modelUid,
        },
        body: {
          title: 'test',
        },
      },
      { state }
    );

    await singleTypes.createOrUpdate(ctx);

    expect(permissionChecker.cannot.create).toHaveBeenCalled();

    expect(createFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'test',
        created_by: 1,
        updated_by: 1,
      }),
      modelUid
    );

    expect(sendTelemetry).toHaveBeenCalledWith('didCreateFirstContentTypeEntry', {
      model: modelUid,
    });
  });

  test('Successfull delete', async () => {
    const modelUid = 'test-uid';

    const entity = {
      id: 1,
      title: 'entityTitle',
    };

    const state = {
      userAbility: {
        can: jest.fn(),
        cannot: jest.fn(() => false),
      },
      user: {
        id: 1,
      },
    };

    const createPermissionsManager = jest.fn(() => ({
      ability: state.userAbility,
    }));

    const permissionChecker = {
      cannot: {
        delete: jest.fn(() => false),
      },
      sanitizeOutput: jest.fn(obj => obj),
    };

    const deleteFn = jest.fn(() => ({}));
    const setLock = jest.fn(() => ({ lock: { uid: '123' } }));
    const unlock = jest.fn();

    global.strapi = {
      admin: {
        services: {
          permission: {
            createPermissionsManager,
          },
        },
      },
      getModel() {
        return {
          options: {
            draftAndPublish: true,
          },
          attributes: {
            title: {
              type: 'string',
            },
          },
        };
      },
      plugins: {
        'content-manager': {
          services: {
            'entity-manager': {
              find() {
                return Promise.resolve(entity);
              },
              assocCreatorRoles(entity) {
                return entity;
              },
              delete: deleteFn,
            },
            'permission-checker': {
              create() {
                return permissionChecker;
              },
            },
            'editing-lock': { setLock, unlock },
          },
        },
      },
      entityService: {
        find: jest.fn(),
      },
    };

    const ctx = createContext(
      {
        params: {
          id: entity.id,
          model: modelUid,
        },
      },
      { state }
    );

    await singleTypes.delete(ctx);

    expect(deleteFn).toHaveBeenCalledWith(entity, modelUid);
    expect(permissionChecker.cannot.delete).toHaveBeenCalledWith(entity);
    expect(permissionChecker.sanitizeOutput).toHaveBeenCalled();
  });

  test('Successfull publish', async () => {
    const modelUid = 'test-uid';

    const entity = {
      id: 1,
      title: 'entityTitle',
    };

    const state = {
      userAbility: {
        can: jest.fn(),
        cannot: jest.fn(() => false),
      },
      user: {
        id: 1,
      },
    };

    const createPermissionsManager = jest.fn(() => ({
      ability: state.userAbility,
    }));

    const permissionChecker = {
      cannot: {
        publish: jest.fn(() => false),
      },
      sanitizeOutput: jest.fn(obj => obj),
    };

    const publishFn = jest.fn(() => ({}));
    const setLock = jest.fn(() => ({ lock: { uid: '123' } }));
    const unlock = jest.fn();

    global.strapi = {
      admin: {
        services: {
          permission: {
            createPermissionsManager,
          },
        },
      },
      getModel() {
        return {
          options: {
            draftAndPublish: true,
          },
          attributes: {
            title: {
              type: 'string',
            },
          },
        };
      },
      plugins: {
        'content-manager': {
          services: {
            'entity-manager': {
              find() {
                return Promise.resolve(entity);
              },
              assocCreatorRoles(entity) {
                return entity;
              },
              publish: publishFn,
            },
            'permission-checker': {
              create() {
                return permissionChecker;
              },
            },
            'editing-lock': { setLock, unlock },
          },
        },
      },
      entityService: {
        find: jest.fn(),
      },
    };

    const ctx = createContext(
      {
        params: {
          id: entity.id,
          model: modelUid,
        },
      },
      { state }
    );

    await singleTypes.publish(ctx);

    expect(publishFn).toHaveBeenCalledWith(entity, modelUid);
    expect(permissionChecker.cannot.publish).toHaveBeenCalledWith(entity);
    expect(permissionChecker.sanitizeOutput).toHaveBeenCalled();
  });

  test('Successfull unpublish', async () => {
    const modelUid = 'test-uid';

    const entity = {
      id: 1,
      title: 'entityTitle',
    };

    const state = {
      userAbility: {
        can: jest.fn(),
        cannot: jest.fn(() => false),
      },
      user: {
        id: 1,
      },
    };

    const createPermissionsManager = jest.fn(() => ({
      ability: state.userAbility,
    }));

    const permissionChecker = {
      cannot: {
        unpublish: jest.fn(() => false),
      },
      sanitizeOutput: jest.fn(obj => obj),
    };

    const unpublishFn = jest.fn(() => ({}));
    const setLock = jest.fn(() => ({ lock: { uid: '123' } }));
    const unlock = jest.fn();

    global.strapi = {
      admin: {
        services: {
          permission: {
            createPermissionsManager,
          },
        },
      },
      getModel() {
        return {
          options: {
            draftAndPublish: true,
          },
          attributes: {
            title: {
              type: 'string',
            },
          },
        };
      },
      plugins: {
        'content-manager': {
          services: {
            'entity-manager': {
              find() {
                return Promise.resolve(entity);
              },
              assocCreatorRoles(entity) {
                return entity;
              },
              unpublish: unpublishFn,
            },
            'permission-checker': {
              create() {
                return permissionChecker;
              },
            },
            'editing-lock': { setLock, unlock },
          },
        },
      },
      entityService: {
        find: jest.fn(),
      },
    };

    const ctx = createContext(
      {
        params: {
          id: entity.id,
          model: modelUid,
        },
      },
      { state }
    );

    await singleTypes.unpublish(ctx);

    expect(unpublishFn).toHaveBeenCalledWith(entity, modelUid);
    expect(permissionChecker.cannot.unpublish).toHaveBeenCalledWith(entity);
    expect(permissionChecker.sanitizeOutput).toHaveBeenCalled();
  });
});
