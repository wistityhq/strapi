'use strict';

const { merge } = require('lodash/fp');
const { getService } = require('../../utils');
const adminActions = require('../admin-actions');
const adminConditions = require('../admin-conditions');

const defaultAdminAuthSettings = {
  providers: {
    autoRegister: false,
    defaultRole: null,
  },
};

const registerPermissionActions = () => {
  getService('permission').actionProvider.registerMany(adminActions.actions);
};

const registerAdminConditions = () => {
  getService('permission').conditionProvider.registerMany(adminConditions.conditions);
};

const syncAuthSettings = async () => {
  const adminStore = await strapi.store({ type: 'core', environment: '', name: 'admin' });
  const adminAuthSettings = await adminStore.get({ key: 'auth' });
  const newAuthSettings = merge(defaultAdminAuthSettings, adminAuthSettings);

  const roleExists = await strapi.admin.services.role.exists({
    id: newAuthSettings.providers.defaultRole,
  });

  // Reset the default SSO role if it has been deleted manually
  if (!roleExists) {
    newAuthSettings.providers.defaultRole = null;
  }

  await adminStore.set({ key: 'auth', value: newAuthSettings });
};

module.exports = async () => {
  registerAdminConditions();
  registerPermissionActions();

  const permissionService = getService('permission');
  const userService = getService('user');
  const roleService = getService('role');

  await roleService.createRolesIfNoneExist();
  await roleService.resetSuperAdminPermissions();
  await roleService.displayWarningIfNoSuperAdmin();

  await permissionService.ensureBoundPermissionsInDatabase();
  await permissionService.cleanPermissionsInDatabase();

  await userService.displayWarningIfUsersDontHaveRole();

  await syncAuthSettings();

  strapi.admin.destroy = async () => {
    const { conditionProvider, actionProvider } = getService('permission');

    await conditionProvider.clear();
    await actionProvider.clear();
  };
};
