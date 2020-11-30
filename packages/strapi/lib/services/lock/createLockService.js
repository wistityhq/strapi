'use strict';

const _ = require('lodash/fp');
const { v4: uuid } = require('uuid');

const toDBObject = ({ key, metadata, ttl }, { now }) => {
  return {
    uid: uuid(),
    key,
    metadata,
    expiresAt: _.isNil(ttl) ? null : now + ttl,
  };
};

const fromDBObject = (lock, prefix) => {
  if (_.isNil(lock)) {
    return null;
  }

  const formattedLock = _.omit(['created_at', 'updated_at'], {
    ...lock,
    createdAt: lock.createdAt || lock.created_at,
    updatedAt: lock.updatedAt || lock.updated_at,
    expiresAt: _.isNil(lock.expiresAt) ? null : Number(lock.expiresAt),
    key: lock.key.replace(new RegExp(`^${prefix}::`), ''),
  });

  return formattedLock;
};

const isLockFree = (lock, now) => {
  return !lock || (!_.isNull(lock.expiresAt) && lock.expiresAt <= now);
};

const validateKey = key => {
  if (!_.isString(key) || _.isEmpty(key)) {
    throw new Error('lockservice: key param has to be a non-empty string');
  }
};
const validateUid = uid => {
  if (!_.isString(uid) || _.isEmpty(uid)) {
    throw new Error('lockservice: uid param has to be a non-empty string');
  }
};
const validateTTL = (ttl, canBeNull = true) => {
  if (!_.isInteger(ttl) && !(canBeNull && _.isNull(ttl))) {
    throw new Error(`lockservice: ttl param has to be an integer${canBeNull ? ' or null' : ''}`);
  }
};
const validateMetadata = metadata => {
  try {
    JSON.stringify(metadata);
  } catch {
    throw new Error('lockservice: metadata param could not be stringified');
  }
};

const getNow = now => {
  return _.isInteger(now) ? now : Date.now();
};

const createLockService = ({ db }) => ({ prefix }) => {
  if (!_.isString(prefix) || _.isEmpty(prefix)) {
    throw new Error('lockservice: prefix param has to be a non-empty string');
  }
  const lockQueries = db.query('strapi_locks');
  const getPrefixedKey = key => `${prefix}::${key}`;

  return {
    async delete(key, uid) {
      validateUid(uid);
      const prefixedKey = getPrefixedKey(key);
      const [lock] = await lockQueries.delete({ key: prefixedKey, uid });
      return { lock: fromDBObject(lock, prefix) };
    },

    async get(key, now) {
      const nowDate = getNow(now);
      const prefixedKey = getPrefixedKey(key);
      const existingLock = await lockQueries.findOne({ key: prefixedKey });
      return {
        isLockFree: isLockFree(existingLock, nowDate),
        lock: fromDBObject(existingLock, prefix),
      };
    },

    async extend({ key, uid, ttl = 10000, metadata }, { mergeMetadata = false } = {}) {
      validateUid(uid);
      validateTTL(ttl, false);
      validateMetadata(metadata);
      const prefixedKey = getPrefixedKey(key);
      const now = Date.now();
      const updateData = { expiresAt: now + ttl };
      const { isLockFree, lock: existingLock } = await this.get(key, now);

      if (isLockFree || !existingLock || existingLock.uid !== uid) {
        // can only extend locks that are still valid
        return {
          success: false,
          lock: existingLock,
        };
      }

      if (!_.isUndefined(metadata)) {
        if (mergeMetadata) {
          updateData.metadata = _.merge(existingLock.metadata, metadata);
        } else {
          updateData.metadata = metadata;
        }
      }

      const updatedLock = await lockQueries.update(
        { id: existingLock.id, key: prefixedKey, uid },
        updateData
      );

      return {
        success: !!updatedLock,
        lock: fromDBObject(updatedLock, prefix),
      };
    },

    async editMetadata({ key, metadata }, { mergeMetadata = false } = {}) {
      validateMetadata(metadata);
      const prefixedKey = getPrefixedKey(key);
      const { lock: existingLock } = await this.get(key);
      if (_.isUndefined(metadata) || !existingLock) {
        return {
          success: false,
          lock: existingLock,
        };
      }

      let newMetadata;
      if (mergeMetadata) {
        newMetadata = _.merge(existingLock.metadata, metadata);
      } else {
        newMetadata = metadata;
      }

      const updatedLock = await lockQueries.update(
        { id: existingLock.id, key: prefixedKey, uid: existingLock.uid },
        { metadata: newMetadata }
      );

      return {
        success: !!updatedLock,
        lock: fromDBObject(updatedLock, prefix),
      };
    },

    async set({ key, metadata = null, ttl = null } = {}, { force = false } = {}) {
      validateKey(key);
      validateTTL(ttl);
      validateMetadata(metadata);
      const prefixedKey = getPrefixedKey(key);
      const now = Date.now();
      const newLock = toDBObject({ key: prefixedKey, metadata, ttl }, { now });
      const { isLockFree: isExistingLockFree, lock: existingLock } = await this.get(key, now);

      try {
        if (!existingLock) {
          const lock = await lockQueries.create(newLock);
          return { success: true, lock: fromDBObject(lock, prefix) };
        }

        if (isExistingLockFree || force) {
          await lockQueries.delete({ key: prefixedKey });
          const lock = await lockQueries.create(newLock);
          return { success: true, lock: fromDBObject(lock, prefix) };
        }
      } catch (e) {
        const foudLock = await this.get(key, now);
        return { success: false, lock: _.getOr(null, 'lock', foudLock) };
      }

      return { success: false, lock: existingLock };
    },
  };
};

module.exports = createLockService;
