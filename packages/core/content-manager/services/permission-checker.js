'use strict';

const ACTIONS = {
  read: 'plugins::content-manager.explorer.read',
  create: 'plugins::content-manager.explorer.create',
  update: 'plugins::content-manager.explorer.update',
  delete: 'plugins::content-manager.explorer.delete',
  publish: 'plugins::content-manager.explorer.publish',
  unpublish: 'plugins::content-manager.explorer.publish',
};

const createPermissionChecker = strapi => ({ userAbility, model }) => {
  const permissionsManager = strapi.admin.services.permission.createPermissionsManager({
    ability: userAbility,
    model,
  });

  const toSubject = entity => (entity ? permissionsManager.toSubject(entity, model) : model);

  const can = (action, entity, field) => {
    return userAbility.can(action, toSubject(entity), field);
  };

  const cannot = (action, entity, field) => {
    return userAbility.cannot(action, toSubject(entity), field);
  };

  const sanitizeOutput = (data, { action = ACTIONS.read } = {}) => {
    return permissionsManager.sanitize(data, {
      subject: toSubject(data),
      action,
    });
  };

  const sanitizeInput = (action, data, entity) => {
    return permissionsManager.sanitize(data, {
      subject: entity ? toSubject(entity) : model,
      action,
      isOutput: false,
    });
  };

  const sanitizeCreateInput = data => sanitizeInput(ACTIONS.create, data);
  const sanitizeUpdateInput = entity => data => sanitizeInput(ACTIONS.update, data, entity);

  const buildPermissionQuery = (query, action) => permissionsManager.queryFrom(query, action);

  const buildReadQuery = query => buildPermissionQuery(query, ACTIONS.read);
  const buildDeleteQuery = query => buildPermissionQuery(query, ACTIONS.delete);

  Object.keys(ACTIONS).forEach(action => {
    can[action] = (...args) => can(ACTIONS[action], ...args);
    cannot[action] = (...args) => cannot(ACTIONS[action], ...args);
  });

  return {
    can,
    cannot,
    sanitizeOutput,
    sanitizeCreateInput,
    sanitizeUpdateInput,
    buildReadQuery,
    buildDeleteQuery,
  };
};

module.exports = ({ strapi }) => ({
  create: createPermissionChecker(strapi),
});
