'use strict';

const _ = require('lodash/fp');
const { webhook: webhookUtils } = require('strapi-utils');
const { TTL, LOCK_PREFIX } = require('./constants').lock;

const acceptedMetadata = ['lastActivityDate'];

const { ENTRY_UPDATE, ENTRY_CREATE } = webhookUtils.webhookEvents;

const getLockKey = (model, entryId) => {
  const { kind } = strapi.getModel(model);
  return kind === 'singleType' ? `edit:${model}` : `edit:${model}:${entryId}`;
};

const getLock = async ({ model, entityId }) => {
  const lockService = strapi.lockService({ prefix: LOCK_PREFIX });
  const key = getLockKey(model, entityId);
  const lockResult = await lockService.get(key);
  return {
    isLockFree: lockResult.isLockFree,
    lock: lockResult.lock,
  };
};

const setLock = async ({ model, entityId, metadata = {}, user }, { force = false } = {}) => {
  const lockService = strapi.lockService({ prefix: LOCK_PREFIX });
  const key = getLockKey(model, entityId);
  const previousLock = await lockService.get(key);
  const fullMetadata = {
    ..._.pick(acceptedMetadata, metadata),
    lastUpdatedAt: _.getOr(Date.now(), 'lock.metadata.lastUpdatedAt', previousLock),
    lockedBy: {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      username: user.username,
    },
  };

  const lockResult = await lockService.set({ key, metadata: fullMetadata, ttl: TTL }, { force });
  return {
    success: lockResult.success,
    lock: lockResult.lock,
  };
};

const extendLock = async ({ model, entityId, uid, metadata }) => {
  const lockService = strapi.lockService({ prefix: LOCK_PREFIX });
  const key = getLockKey(model, entityId);
  let fullMetadata = undefined;
  if (!_.isUndefined(metadata)) {
    fullMetadata = _.pick(acceptedMetadata, metadata);
  }

  const lockResult = await lockService.extend(
    { key, metadata: fullMetadata, ttl: TTL, uid },
    { mergeMetadata: true }
  );
  return {
    success: lockResult.success,
    lock: lockResult.lock,
  };
};

const unlock = async ({ model, entityId, uid }) => {
  const lockService = strapi.lockService({ prefix: LOCK_PREFIX });
  const key = getLockKey(model, entityId);

  // extend with ttl to 0 instead of deleting lock in order to keep metadata accessible
  // (especially the lastUpdatedAt info)
  const lockResult = await lockService.extend({ key, uid, ttl: 0 });
  return {
    success: lockResult.success,
    lock: lockResult.lock,
  };
};

const editMetadata = ({ model, entityId, metadata }, { mergeMetadata = true } = {}) => {
  const key = getLockKey(model, entityId);
  const lockService = strapi.lockService({ prefix: LOCK_PREFIX });
  return lockService.editMetadata({ key, metadata }, { mergeMetadata });
};

const updateLastUpdatedAtMetadata = async ({ model, entityId }) => {
  const { kind } = strapi.getModel(model);
  if (entityId || kind === 'singleType') {
    await editMetadata({
      model,
      entityId,
      metadata: {
        lastUpdatedAt: Date.now(),
      },
    });
  }
};

const registerLockHook = () => {
  const updateLastUpdatedAtHook = event => async ({ modelUID, entry }) => {
    const { kind } = strapi.getModel(modelUID);
    if (event === ENTRY_CREATE && kind !== 'singleType') {
      // Handles the usecase where 2 users are on the single type entry and one creates it
      return;
    }

    await updateLastUpdatedAtMetadata({
      model: modelUID,
      entityId: entry.id,
    });
  };

  strapi.eventHub.on(ENTRY_UPDATE, updateLastUpdatedAtHook(ENTRY_UPDATE));
  strapi.eventHub.on(ENTRY_CREATE, updateLastUpdatedAtHook(ENTRY_CREATE));
};

const validateAndExtendLock = async ({ model, entityId, uid }) => {
  if (!_.isString(uid) || _.isEmpty(uid)) {
    throw strapi.errors.badRequest('uid query param is invalid');
  }

  const lockResult = await extendLock({
    model,
    entityId,
    uid,
  });

  if (!lockResult.success) {
    throw strapi.errors.badRequest('Someone took over the edition of this entry');
  }
};

module.exports = {
  setLock,
  extendLock,
  unlock,
  getLock,
  registerLockHook,
  validateAndExtendLock,
};
