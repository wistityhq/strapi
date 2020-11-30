'use strict';

const _ = require('lodash/fp');
const { getService } = require('../utils');
const { validateLockInput, validateExtendLockInput } = require('./validation');

const sanitizeLock = (lock, { withUid = false } = {}) => {
  if (_.isNil(lock)) {
    return null;
  }

  const omittedAttributes = ['key', 'id'];
  if (!withUid) {
    omittedAttributes.push('uid');
  }

  return _.omit(omittedAttributes, lock);
};

const isAllowedToUpdateTheLock = permissionChecker => (entity, kind, checkEntity = false) => {
  const entityToCheck = checkEntity ? entity : undefined;
  if (kind !== 'singleType') {
    return permissionChecker.can.update(entityToCheck);
  } else {
    return (
      permissionChecker.can.update(entityToCheck) || permissionChecker.can.create(entityToCheck)
    );
  }
};

const checkPermissions = async ({ model, id, userAbility }) => {
  const { kind } = strapi.getModel(model);
  const isSingleType = kind === 'singleType';
  const entityManager = getService('entity-manager');
  const permissionChecker = getService('permission-checker').create({ userAbility, model });

  if (!isAllowedToUpdateTheLock(permissionChecker)(null, kind, false)) {
    throw strapi.errors.forbidden();
  }

  let entity;
  if (isSingleType) {
    const entityWithoutAssoc = await entityManager.find({}, model);
    entity = entityManager.assocCreatorRoles(entityWithoutAssoc);
  } else {
    entity = await entityManager.findOneWithCreatorRoles(id, model);
  }

  if (!isSingleType && !entity) {
    throw strapi.errors.notFound();
  }

  if (!isAllowedToUpdateTheLock(permissionChecker)(entity, kind, true)) {
    throw strapi.errors.forbidden();
  }
};

const getLock = async ctx => {
  const {
    state: { userAbility },
    params: { id, model },
  } = ctx;

  await checkPermissions({ model, id, userAbility });

  const editingLockService = getService('editing-lock');
  const lockResult = await editingLockService.getLock({ model, entityId: id });

  return {
    isLockFree: lockResult.isLockFree,
    lockInfo: sanitizeLock(lockResult.lock),
  };
};

const lock = async ctx => {
  const {
    state: { userAbility, user },
    params: { id, model },
    request: { body },
  } = ctx;

  try {
    await validateLockInput(body);
  } catch (err) {
    return ctx.badRequest('ValidationError', err);
  }

  await checkPermissions({ model, id, userAbility });

  const metadata = _.getOr({}, 'metadata', body);
  const force = _.getOr(false, 'force', body) === true;
  const editingLockService = getService('editing-lock');
  const lockResult = await editingLockService.setLock(
    { model, entityId: id, metadata, user },
    { force }
  );

  return {
    success: lockResult.success,
    lockInfo: sanitizeLock(lockResult.lock, { withUid: true }),
  };
};

const extendLock = async ctx => {
  const {
    state: { userAbility },
    params: { id, model },
    request: { body },
  } = ctx;

  try {
    await validateExtendLockInput(body);
  } catch (err) {
    return ctx.badRequest('ValidationError', err);
  }

  await checkPermissions({ model, id, userAbility });

  const metadata = _.getOr(undefined, 'metadata', body);
  const editingLockService = getService('editing-lock');
  const lockResult = await editingLockService.extendLock({
    model,
    entityId: id,
    metadata,
    uid: body.uid,
  });

  return {
    success: lockResult.success,
    lockInfo: sanitizeLock(lockResult.lock),
  };
};

const unlock = async ctx => {
  const {
    state: { userAbility },
    params: { id, model },
    request: { body },
  } = ctx;

  try {
    await validateExtendLockInput(body);
  } catch (err) {
    return ctx.badRequest('ValidationError', err);
  }

  await checkPermissions({ model, id, userAbility });

  const editingLockService = getService('editing-lock');
  const lockResult = await editingLockService.unlock({ model, entityId: id, uid: body.uid });

  return {
    success: lockResult.success,
    lockInfo: sanitizeLock(lockResult.lock),
  };
};

module.exports = {
  lock,
  extendLock,
  unlock,
  getLock,
};
