'use strict';

const {
  flatMap,
  reject,
  isNil,
  isArray,
  prop,
  xor,
  eq,
  uniq,
  map,
  difference,
  differenceWith,
  pipe,
} = require('lodash/fp');
const pmap = require('p-map');
const { EDITOR_CODE } = require('../constants');
const { getBoundActionsBySubject, BOUND_ACTIONS_FOR_FIELDS } = require('../../domain/role');
const { getService } = require('../../utils');
const permissionDomain = require('../../domain/permission/index');

/**
 * Delete permissions of roles in database
 * @param rolesIds ids of roles
 * @returns {Promise<array>}
 */
const deleteByRolesIds = async rolesIds => {
  // FIXME: need to delete associations in delete many
  await strapi.query('strapi::permission').deleteMany({
    where: {
      role: { id: rolesIds },
    },
  });
};

/**
 * Delete permissions
 * @param ids ids of permissions
 * @returns {Promise<array>}
 */
const deleteByIds = async ids => {
  for (const id of ids) {
    await strapi.query('strapi::permission').delete({ where: { id } });
  }

  // FIXME: find a way to do delete many with auto association deletes (FKs should do the job)$
  // await strapi.query('strapi::permission').deleteMany({ where: { id: ids } });
};

/**
 * Create many permissions
 * @param permissions
 * @returns {Promise<*[]|*>}
 */
const createMany = async permissions => {
  const createdPermissions = [];
  for (const permission of permissions) {
    const newPerm = await strapi.query('strapi::permission').create({ data: permission });
    createdPermissions.push(newPerm);
  }

  return permissionDomain.toPermission(createdPermissions);

  // FIXME:
  // await strapi.query('strapi::permission').createMany({ data: permissions })
};

/**
 * Update a permission
 * @returns {Promise<*[]|*>}
 * @param params
 * @param attributes
 */
const update = async (params, attributes) => {
  const updatedPermission = await strapi
    .query('strapi::permission')
    .update({ where: params, data: attributes });

  return permissionDomain.toPermission(updatedPermission);
};

/**
 * Find assigned permissions in the database
 * @param params query params to find the permissions
 * @returns {Promise<Permission[]>}
 */
const findMany = async (params = {}) => {
  const rawPermissions = await strapi.query('strapi::permission').findMany(params);

  return permissionDomain.toPermission(rawPermissions);
};

/**
 * Find all permissions for a user
 * @param user - user
 * @returns {Promise<Permission[]>}
 */
const findUserPermissions = async user => {
  return findMany({ where: { role: { users: { id: user.id } } } });
};

const filterPermissionsToRemove = async permissions => {
  const { actionProvider } = getService('permission');

  const permissionsToRemove = [];

  for (const permission of permissions) {
    const { subjects, options = {} } = actionProvider.get(permission.action) || {};
    const { applyToProperties } = options;

    const invalidProperties = await Promise.all(
      (applyToProperties || []).map(async property => {
        const applies = await actionProvider.appliesToProperty(
          property,
          permission.action,
          permission.subject
        );

        return applies && isNil(permissionDomain.getProperty(property, permission));
      })
    );

    const isRegisteredAction = actionProvider.has(permission.action);
    const hasInvalidProperties = isArray(applyToProperties) && invalidProperties.every(eq(true));
    const isInvalidSubject = isArray(subjects) && !subjects.includes(permission.subject);

    // If the permission has an invalid action, an invalid subject or invalid properties, then add it to the toBeRemoved collection
    if (!isRegisteredAction || isInvalidSubject || hasInvalidProperties) {
      permissionsToRemove.push(permission);
    }
  }

  return permissionsToRemove;
};

/**
 * Removes permissions in database that don't exist anymore
 * @returns {Promise<>}
 */
const cleanPermissionsInDatabase = async () => {
  const pageSize = 200;

  const contentTypeService = getService('content-type');

  const total = await strapi.query('strapi::permission').count();
  const pageCount = Math.ceil(total / pageSize);

  for (let page = 0; page < pageCount; page++) {
    // 1. Find invalid permissions and collect their ID to delete them later
    const results = await strapi
      .query('strapi::permission')
      .findMany({ limit: pageSize, offset: page * pageSize });

    const permissions = permissionDomain.toPermission(results);
    const permissionsToRemove = await filterPermissionsToRemove(permissions);
    const permissionsIdToRemove = map(prop('id'), permissionsToRemove);

    // 2. Clean permissions' fields (add required ones, remove the non-existing ones)
    const remainingPermissions = permissions.filter(
      permission => !permissionsIdToRemove.includes(permission.id)
    );

    const permissionsWithCleanFields = contentTypeService.cleanPermissionFields(
      remainingPermissions
    );

    // Update only the ones that need to be updated
    const permissionsNeedingToBeUpdated = differenceWith(
      (a, b) => {
        return a.id === b.id && xor(a.properties.fields, b.properties.fields).length === 0;
      },
      permissionsWithCleanFields,
      remainingPermissions
    );

    const updatePromiseProvider = permission => {
      return update({ id: permission.id }, permission);
    };

    // Execute all the queries, update the database
    await Promise.all([
      deleteByIds(permissionsIdToRemove),
      pmap(permissionsNeedingToBeUpdated, updatePromiseProvider, {
        concurrency: 100,
        stopOnError: true,
      }),
    ]);
  }
};

const ensureBoundPermissionsInDatabase = async () => {
  if (strapi.EE) {
    return;
  }

  const contentTypes = Object.values(strapi.contentTypes);
  const editorRole = await strapi.query('strapi::role').findOne({
    where: { code: EDITOR_CODE },
  });

  if (isNil(editorRole)) {
    return;
  }

  for (const contentType of contentTypes) {
    const boundActions = getBoundActionsBySubject(editorRole, contentType.uid);

    const permissions = await findMany({
      where: {
        subject: contentType.uid,
        action: boundActions,
        role: { id: editorRole.id },
      },
    });

    if (permissions.length === 0) {
      return;
    }

    const fields = pipe(
      flatMap(permissionDomain.getProperty('fields')),
      reject(isNil),
      uniq
    )(permissions);

    // Handle the scenario where permissions are missing
    const missingActions = difference(map('action', permissions), boundActions);

    if (missingActions.length > 0) {
      const permissions = pipe(
        // Create a permission skeleton from the action id
        map(action => ({ action, subject: contentType.uid, role: editorRole.id })),
        // Use the permission domain to create a clean permission from the given object
        map(permissionDomain.create),
        // Adds the fields property if the permission action is eligible
        map(permission =>
          BOUND_ACTIONS_FOR_FIELDS.includes(permission.action)
            ? permissionDomain.setProperty('fields', fields, permission)
            : permission
        )
      )(missingActions);

      await createMany(permissions);
    }
  }
};

module.exports = {
  createMany,
  findMany,
  deleteByRolesIds,
  deleteByIds,
  findUserPermissions,
  cleanPermissionsInDatabase,
  ensureBoundPermissionsInDatabase,
};
