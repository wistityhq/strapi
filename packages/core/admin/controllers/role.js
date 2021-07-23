'use strict';

const { yup, formatYupErrors } = require('@strapi/utils');
const { validateRoleUpdateInput } = require('../validation/role');
const { validatedUpdatePermissionsInput } = require('../validation/permission');
const { EDITOR_CODE, AUTHOR_CODE, SUPER_ADMIN_CODE } = require('../services/constants');
const { getService } = require('../utils');

module.exports = {
  /**
   * Returns on role by id
   * @param {KoaContext} ctx - koa context
   */
  async findOne(ctx) {
    const { id } = ctx.params;
    const role = await getService('role').findOneWithUsersCount({ id });

    if (!role) {
      return ctx.notFound('role.notFound');
    }

    ctx.body = {
      data: role,
    };
  },

  /**
   * Returns every roles
   * @param {KoaContext} ctx - koa context
   */
  async findAll(ctx) {
    const roles = await getService('role').findAllWithUsersCount();

    ctx.body = {
      data: roles,
    };
  },

  /**
   * Updates a role by id
   * @param {KoaContext} ctx - koa context
   */
  async update(ctx) {
    const { id } = ctx.params;
    const { body } = ctx.request;

    const roleService = getService('role');

    try {
      await validateRoleUpdateInput(body);
    } catch (err) {
      return ctx.badRequest('ValidationError', err);
    }

    const role = await roleService.findOne({ id });

    if (!role) {
      return ctx.notFound('role.notFound');
    }

    if (role.code === SUPER_ADMIN_CODE) {
      return ctx.badRequest("Super admin can't be edited.");
    }

    const updatedRole = await roleService.update({ id }, body);
    const sanitizedRole = roleService.sanitizeRole(updatedRole);

    ctx.body = {
      data: sanitizedRole,
    };
  },

  /**
   * Returns the permissions assigned to a role
   * @param {KoaContext} ctx - koa context
   */
  async getPermissions(ctx) {
    const { id } = ctx.params;

    const roleService = getService('role');
    const permissionService = getService('permission');

    const role = await roleService.findOne({ id });

    if (!role) {
      return ctx.notFound('role.notFound');
    }

    const permissions = await permissionService.findMany({ where: { role: { id: role.id } } });

    const sanitizedPermissions = permissions.map(permissionService.sanitizePermission);

    ctx.body = {
      data: sanitizedPermissions,
    };
  },

  /**
   * Updates the permissions assigned to a role
   * @param {KoaContext} ctx - koa context
   */
  async updatePermissions(ctx) {
    const { id } = ctx.params;
    const { body: input } = ctx.request;

    const { findOne, assignPermissions } = getService('role');
    const { sanitizePermission, actionProvider } = getService('permission');

    const role = await findOne({ id });

    if (!role) {
      return ctx.notFound('role.notFound');
    }

    try {
      if (role.code === SUPER_ADMIN_CODE) {
        throw formatYupErrors(new yup.ValidationError("Super admin permissions can't be edited."));
      }

      await validatedUpdatePermissionsInput(input, role);
    } catch (err) {
      return ctx.badRequest('ValidationError', err);
    }

    let permissionsToAssign;

    if ([EDITOR_CODE, AUTHOR_CODE].includes(role.code)) {
      permissionsToAssign = input.permissions.map(permission => {
        const action = actionProvider.get(permission.action);

        if (action.section !== 'contentTypes') {
          return permission;
        }

        const conditions = role.code === AUTHOR_CODE ? ['admin::is-creator'] : [];

        return { ...permission, conditions };
      });
    } else {
      permissionsToAssign = input.permissions;
    }

    const permissions = await assignPermissions(role.id, permissionsToAssign);

    ctx.body = {
      data: permissions.map(sanitizePermission),
    };
  },
};
