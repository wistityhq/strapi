'use strict';

const { capitalize, isArray, getOr, prop } = require('lodash/fp');
const { getService } = require('../../utils');

const actions = ['create', 'read', 'update', 'delete'].map(uid => ({
  section: 'settings',
  category: 'Internationalization',
  subCategory: 'Locales',
  pluginName: 'i18n',
  displayName: capitalize(uid),
  uid: `locale.${uid}`,
}));

const addLocalesPropertyIfNeeded = ({ value: action }) => {
  const {
    section,
    options: { applyToProperties },
  } = action;

  // Only add the locales property to contentTypes' actions
  if (section !== 'contentTypes') {
    return;
  }

  // If the 'locales' property is already declared within the applyToProperties array, then ignore the next steps
  if (isArray(applyToProperties) && applyToProperties.includes('locales')) {
    return;
  }

  // Add the 'locales' property to the applyToProperties array (create it if necessary)
  action.options.applyToProperties = isArray(applyToProperties)
    ? applyToProperties.concat('locales')
    : ['locales'];
};

const shouldApplyLocalesPropertyToSubject = ({ property, subject }) => {
  if (property === 'locales') {
    const model = strapi.getModel(subject);

    return getService('content-types').isLocalizedContentType(model);
  }

  return true;
};

const addAllLocalesToPermissions = async permissions => {
  const { actionProvider } = strapi.admin.services.permission;
  const { find: findAllLocales } = getService('locales');

  const allLocales = await findAllLocales();
  const allLocalesCode = allLocales.map(prop('code'));

  return Promise.all(
    permissions.map(async permission => {
      const { action, subject } = permission;

      const appliesToLocalesProperty = await actionProvider.appliesToProperty(
        'locales',
        action,
        subject
      );

      if (!appliesToLocalesProperty) {
        return permission;
      }

      const oldPermissionProperties = getOr({}, 'properties', permission);

      return { ...permission, properties: { ...oldPermissionProperties, locales: allLocalesCode } };
    })
  );
};

const syncSuperAdminPermissionsWithLocales = async () => {
  const roleService = strapi.admin.services.role;
  const permissionService = strapi.admin.services.permission;

  const superAdminRole = await roleService.getSuperAdmin();

  if (!superAdminRole) {
    return;
  }

  const superAdminPermissions = await permissionService.findUserPermissions({
    roles: [superAdminRole],
  });

  const newSuperAdminPermissions = await addAllLocalesToPermissions(superAdminPermissions);

  await roleService.assignPermissions(superAdminRole.id, newSuperAdminPermissions);
};

const registerI18nActions = async () => {
  const { actionProvider } = strapi.admin.services.permission;

  await actionProvider.registerMany(actions);
};

const registerI18nActionsHooks = () => {
  const { actionProvider } = strapi.admin.services.permission;
  const { hooks } = strapi.admin.services.role;

  actionProvider.hooks.appliesPropertyToSubject.register(shouldApplyLocalesPropertyToSubject);
  hooks.willResetSuperAdminPermissions.register(addAllLocalesToPermissions);
};

const updateActionsProperties = () => {
  const { actionProvider } = strapi.admin.services.permission;

  // Register the transformation for every new action
  actionProvider.hooks.willRegister.register(addLocalesPropertyIfNeeded);

  // Handle already registered actions
  actionProvider.values().forEach(action => addLocalesPropertyIfNeeded({ value: action }));
};

module.exports = {
  actions,
  registerI18nActions,
  registerI18nActionsHooks,
  updateActionsProperties,
  syncSuperAdminPermissionsWithLocales,
};
