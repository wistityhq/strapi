'use strict';

const { has, pipe } = require('lodash/fp');

const {
  getService,
  wrapBadRequest,
  setCreatorFields,
  pickWritableAttributes,
} = require('../utils');
const { validateBulkDeleteInput } = require('./validation');

module.exports = {
  async find(ctx) {
    const { userAbility } = ctx.state;
    const { model } = ctx.params;
    const { query } = ctx.request;

    const entityManager = getService('entity-manager');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    if (permissionChecker.cannot.read()) {
      return ctx.forbidden();
    }

    const method = has('_q', query) ? 'searchPage' : 'findPage';

    const permissionQuery = permissionChecker.buildPermissionQuery(query);

    const { results, pagination } = await entityManager[method](permissionQuery, model);

    ctx.body = {
      results: results.map(entity => permissionChecker.sanitizeOutput(entity)),
      pagination,
    };
  },

  async findOne(ctx) {
    const { userAbility } = ctx.state;
    const { model, id } = ctx.params;

    const entityManager = getService('entity-manager');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    if (permissionChecker.cannot.read()) {
      return ctx.forbidden();
    }

    const entity = await entityManager.findOneWithCreatorRoles(id, model);

    if (!entity) {
      return ctx.notFound();
    }

    if (permissionChecker.cannot.read(entity)) {
      return ctx.forbidden();
    }

    ctx.body = permissionChecker.sanitizeOutput(entity);
  },

  async create(ctx) {
    const { userAbility, user } = ctx.state;
    const { model } = ctx.params;
    const { body } = ctx.request;

    const entityManager = getService('entity-manager');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    if (permissionChecker.cannot.create()) {
      return ctx.forbidden();
    }

    const pickWritables = pickWritableAttributes({ model });
    const pickPermittedFields = permissionChecker.sanitizeCreateInput;
    const setCreator = setCreatorFields({ user });

    const sanitizeFn = pipe([pickWritables, pickPermittedFields, setCreator]);

    await wrapBadRequest(async () => {
      const entity = await entityManager.create(sanitizeFn(body), model);
      ctx.body = permissionChecker.sanitizeOutput(entity);

      await strapi.telemetry.send('didCreateFirstContentTypeEntry', { model });
    })();
  },

  async update(ctx) {
    const { userAbility, user } = ctx.state;
    const { id, model } = ctx.params;
    const { body } = ctx.request;
    const { lockUid } = ctx.query;

    const entityManager = getService('entity-manager');
    const editingLockService = getService('editing-lock');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });
    let lock;

    if (permissionChecker.cannot.update()) {
      return ctx.forbidden();
    }

    const entity = await entityManager.findOneWithCreatorRoles(id, model);

    if (!entity) {
      return ctx.notFound();
    }

    if (permissionChecker.cannot.update(entity)) {
      return ctx.forbidden();
    }

    const pickWritables = pickWritableAttributes({ model });
    const pickPermittedFields = permissionChecker.sanitizeUpdateInput(entity);
    const setCreator = setCreatorFields({ user, isEdition: true });

    const sanitizeFn = pipe([pickWritables, pickPermittedFields, setCreator]);

    if (lockUid) {
      await editingLockService.validateAndExtendLock({ model, entityId: id, uid: lockUid });
    } else {
      const lockResult = await editingLockService.setLock(
        { model, entityId: id, user },
        { force: true }
      );
      lock = lockResult.lock;
    }

    await wrapBadRequest(async () => {
      const updatedEntity = await entityManager.update(entity, sanitizeFn(body), model);

      ctx.body = permissionChecker.sanitizeOutput(updatedEntity);
    })();

    if (!lockUid) {
      await editingLockService.unlock({ model, entityId: id, uid: lock.uid }, { force: true });
    }
  },

  async delete(ctx) {
    const { userAbility, user } = ctx.state;
    const { id, model } = ctx.params;
    const { lockUid } = ctx.query;
    let lock;

    const entityManager = getService('entity-manager');
    const editingLockService = getService('editing-lock');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    if (permissionChecker.cannot.delete()) {
      return ctx.forbidden();
    }

    const entity = await entityManager.findOneWithCreatorRoles(id, model);

    if (!entity) {
      return ctx.notFound();
    }

    if (permissionChecker.cannot.delete(entity)) {
      return ctx.forbidden();
    }

    if (lockUid) {
      await editingLockService.validateAndExtendLock({ model, entityId: id, uid: lockUid });
    } else {
      const lockResult = await editingLockService.setLock(
        { model, entityId: id, user },
        { force: true }
      );
      lock = lockResult.lock;
    }

    const result = await entityManager.delete(entity, model);

    if (!lockUid) {
      await editingLockService.unlock({ model, entityId: id, uid: lock.uid }, { force: true });
    }

    ctx.body = permissionChecker.sanitizeOutput(result);
  },

  async publish(ctx) {
    const { userAbility, user } = ctx.state;
    const { id, model } = ctx.params;
    const { lockUid } = ctx.query;
    let lock;

    const entityManager = getService('entity-manager');
    const editingLockService = getService('editing-lock');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    if (permissionChecker.cannot.publish()) {
      return ctx.forbidden();
    }

    const entity = await entityManager.findOneWithCreatorRoles(id, model);

    if (!entity) {
      return ctx.notFound();
    }

    if (permissionChecker.cannot.publish(entity)) {
      return ctx.forbidden();
    }

    if (lockUid) {
      await editingLockService.validateAndExtendLock({ model, entityId: id, uid: lockUid });
    } else {
      const lockResult = await editingLockService.setLock(
        { model, entityId: id, user },
        { force: true }
      );
      lock = lockResult.lock;
    }

    const result = await entityManager.publish(entity, model);

    if (!lockUid) {
      await editingLockService.unlock({ model, entityId: id, uid: lock.uid }, { force: true });
    }

    ctx.body = permissionChecker.sanitizeOutput(result);
  },

  async unpublish(ctx) {
    const { userAbility, user } = ctx.state;
    const { id, model } = ctx.params;
    const { lockUid } = ctx.query;
    let lock;

    const entityManager = getService('entity-manager');
    const editingLockService = getService('editing-lock');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    if (permissionChecker.cannot.unpublish()) {
      return ctx.forbidden();
    }

    const entity = await entityManager.findOneWithCreatorRoles(id, model);

    if (!entity) {
      return ctx.notFound();
    }

    if (permissionChecker.cannot.unpublish(entity)) {
      return ctx.forbidden();
    }

    if (lockUid) {
      await editingLockService.validateAndExtendLock({ model, entityId: id, uid: lockUid });
    } else {
      const lockResult = await editingLockService.setLock(
        { model, entityId: id, user },
        { force: true }
      );
      lock = lockResult.lock;
    }

    const result = await entityManager.unpublish(entity, model);

    if (!lockUid) {
      await editingLockService.unlock({ model, entityId: id, uid: lock.uid }, { force: true });
    }

    ctx.body = permissionChecker.sanitizeOutput(result);
  },

  async bulkdDelete(ctx) {
    const { userAbility, user } = ctx.state;
    const { model } = ctx.params;
    const { query, body } = ctx.request;
    const { ids } = body;

    await validateBulkDeleteInput(body);

    const entityManager = getService('entity-manager');
    const editingLockService = getService('editing-lock');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    if (permissionChecker.cannot.delete()) {
      return ctx.forbidden();
    }

    const permissionQuery = permissionChecker.buildPermissionQuery(query);

    const idsWhereClause = { [`id_in`]: ids };
    const params = {
      ...permissionQuery,
      _where: [idsWhereClause].concat(permissionQuery._where || {}),
    };

    await Promise.all(
      ids.map(entityId => editingLockService.setLock({ model, entityId, user }, { force: true }))
    );

    const results = await entityManager.findAndDelete(params, model);

    ctx.body = results.map(result => permissionChecker.sanitizeOutput(result));
  },
};
