'use strict';

const _ = require('lodash');
const {
  sanitizeEntity,
  webhook: webhookUtils,
  contentTypes: contentTypesUtils,
} = require('strapi-utils');
const uploadFiles = require('./utils/upload-files');

// TODO: those should be strapi events used by the webhooks not the other way arround
const { ENTRY_CREATE, ENTRY_UPDATE, ENTRY_DELETE } = webhookUtils.webhookEvents;

module.exports = ({ db, eventHub, entityValidator }) => ({
  /**
   * expose some utils so the end users can use them
   */
  uploadFiles,
  /**
   * Promise to fetch all records
   *
   * @return {Promise}
   */
  async find({ params, populate }, { model }) {
    const { kind } = db.getModel(model);

    // return first element and ignore filters
    if (kind === 'singleType') {
      const results = await db.query(model).find({ _limit: 1, ...params }, populate);
      return _.first(results) || null;
    }

    return db.query(model).find(params, populate);
  },

  findPage({ params, populate }, { model }) {
    return db.query(model).findPage(params, populate);
  },

  /**
   * Promise to fetch record
   *
   * @return {Promise}
   */

  findOne({ params, populate }, { model }) {
    return db.query(model).findOne(params, populate);
  },

  /**
   * Promise to count record
   *
   * @return {Promise}
   */

  count({ params }, { model }) {
    return db.query(model).count(params);
  },

  /**
   * Promise to add record
   *
   * @return {Promise}
   */

  async create({ data, files }, { model }) {
    const modelDef = db.getModel(model);

    if (modelDef.kind === 'singleType') {
      // check if there is already one entry and throw
      const count = await db.query(model).count();
      if (count >= 1) {
        throw new Error('Single type entry can only be created once');
      }
    }

    const isDraft = contentTypesUtils.isDraft(data, modelDef);

    const validData = await entityValidator.validateEntityCreation(modelDef, data, { isDraft });

    let entry = await db.query(model).create(validData);

    if (files) {
      await this.uploadFiles(entry, files, { model });
      entry = await this.findOne({ params: { id: entry.id } }, { model });
    }

    eventHub.emit(ENTRY_CREATE, {
      modelUID: model,
      model: modelDef.modelName,
      entry: sanitizeEntity(entry, { model: modelDef }),
    });

    return entry;
  },

  /**
   * Promise to edit record
   *
   * @return {Promise}
   */

  async update({ params, data, files }, { model }) {
    const modelDef = db.getModel(model);
    const existingEntry = await db.query(model).findOne(params);

    const isDraft = contentTypesUtils.isDraft(existingEntry, modelDef);

    const validData = await entityValidator.validateEntityUpdate(modelDef, data, {
      isDraft,
    });

    let entry = await db.query(model).update(params, validData);

    if (files) {
      await this.uploadFiles(entry, files, { model });
      entry = await this.findOne({ params: { id: entry.id } }, { model });
    }

    eventHub.emit(ENTRY_UPDATE, {
      modelUID: model,
      model: modelDef.modelName,
      entry: sanitizeEntity(entry, { model: modelDef }),
    });

    return entry;
  },

  /**
   * Promise to delete a record
   *
   * @return {Promise}
   */

  async delete({ params }, { model }) {
    const entry = await db.query(model).delete(params);

    const modelDef = db.getModel(model);
    eventHub.emit(ENTRY_DELETE, {
      modelUID: model,
      model: modelDef.modelName,
      entry: sanitizeEntity(entry, { model: modelDef }),
    });

    return entry;
  },

  /**
   * Promise to search records
   *
   * @return {Promise}
   */

  search({ params, populate }, { model }) {
    return db.query(model).search(params, populate);
  },

  searchPage({ params, populate }, { model }) {
    return db.query(model).searchPage(params, populate);
  },

  /**
   * Promise to count searched records
   *
   * @return {Promise}
   */
  countSearch({ params }, { model }) {
    return db.query(model).countSearch(params);
  },
});
