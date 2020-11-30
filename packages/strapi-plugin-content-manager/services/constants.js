'use strict';

module.exports = {
  ACTIONS: {
    read: 'plugins::content-manager.explorer.read',
    create: 'plugins::content-manager.explorer.create',
    edit: 'plugins::content-manager.explorer.update',
    delete: 'plugins::content-manager.explorer.delete',
    publish: 'plugins::content-manager.explorer.publish',
  },
  lock: {
    TTL: 30000, // lock Time To Live : 30 sec
    LOCK_PREFIX: 'content-manager',
  },
};
