'use strict';

const withDefaultPagination = params => {
  const { page = 1, pageSize = 10, ...rest } = params;

  return {
    page: Number(page),
    pageSize: Number(pageSize),
    ...rest,
  };
};

const createRepository = (uid, db) => {
  return {
    findOne(params) {
      return db.entityManager.findOne(uid, params);
    },

    findMany(params) {
      return db.entityManager.findMany(uid, params);
    },

    findWithCount(params) {
      return Promise.all([
        db.entityManager.findMany(uid, params),
        db.entityManager.count(uid, params),
      ]);
    },

    async findPage(params) {
      const { page, pageSize, ...rest } = withDefaultPagination(params);

      const offset = Math.max(page - 1, 0) * pageSize;
      const limit = pageSize;

      const query = {
        ...rest,
        limit,
        offset,
      };

      const [results, total] = await Promise.all([
        db.entityManager.findMany(uid, query),
        db.entityManager.count(uid, query),
      ]);

      return {
        results,
        pagination: {
          page,
          pageSize,
          pageCount: Math.ceil(total / pageSize),
          total,
        },
      };
    },

    create(params) {
      return db.entityManager.create(uid, params);
    },

    createMany(params) {
      return db.entityManager.createMany(uid, params);
    },

    update(params) {
      return db.entityManager.update(uid, params);
    },

    updateMany(params) {
      return db.entityManager.updateMany(uid, params);
    },

    delete(params) {
      return db.entityManager.delete(uid, params);
    },

    deleteMany(params) {
      return db.entityManager.deleteMany(uid, params);
    },

    count(params) {
      return db.entityManager.count(uid, params);
    },

    attachRelations(id, data) {
      return db.entityManager.attachRelations(uid, id, data);
    },

    updateRelations(id, data) {
      return db.entityManager.updateRelations(uid, id, data);
    },

    deleteRelations(id) {
      return db.entityManager.deleteRelations(uid, id);
    },

    // TODO: add relation API
    populate(entity, field, params) {
      return db.entityManager.populate(uid, entity, field, params);
    },

    load(entity, field, params) {
      return db.entityManager.load(uid, entity, field, params);
    },
  };
};

module.exports = {
  createRepository,
};
