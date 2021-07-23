'use strict';

const createLifecycleManager = require('../lifecycle-manager');

describe('Lifecycle Manager', () => {
  test('Allows registering lifecycles', () => {
    const manager = createLifecycleManager();

    const lifecycle = {};
    manager.register(lifecycle);

    expect(manager.lifecycles).toEqual([lifecycle]);
  });

  test('Will run all the lifecycles if no model specified', async () => {
    const lifecycleA = {
      find: jest.fn(),
    };

    const lifecycleB = {
      find: jest.fn(),
    };

    const manager = createLifecycleManager();

    manager.register(lifecycleA).register(lifecycleB);

    await manager.run('find', { uid: 'test-uid' });

    expect(lifecycleA.find).toHaveBeenCalled();
    expect(lifecycleB.find).toHaveBeenCalled();
  });

  test('Will match on model if specified', async () => {
    const lifecycleA = {
      model: 'test-uid',
      find: jest.fn(),
    };

    const lifecycleB = {
      model: 'other-uid',
      find: jest.fn(),
    };

    const manager = createLifecycleManager();

    manager.register(lifecycleA).register(lifecycleB);

    await manager.run('find', { uid: 'test-uid' });

    expect(lifecycleA.find).toHaveBeenCalled();
    expect(lifecycleB.find).not.toHaveBeenCalled();
  });
});
