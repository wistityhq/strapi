'use strict';

const _ = require('lodash');
const { sanitizeEntity } = require('@strapi/utils');
const validateSettings = require('../validation/settings');
const validateUploadBody = require('../validation/upload');

const sanitize = (data, options = {}) => {
  return sanitizeEntity(data, {
    model: strapi.getModel('file', 'upload'),
    ...options,
  });
};

module.exports = {
  async find(ctx) {
    const method = _.has(ctx.query, '_q') ? 'search' : 'fetchAll';

    const files = await strapi.plugins.upload.services.upload[method](ctx.query);

    ctx.body = sanitize(files);
  },

  async findOne(ctx) {
    const {
      params: { id },
    } = ctx;

    const file = await strapi.plugins.upload.services.upload.findOne({ id });

    if (!file) {
      return ctx.notFound('file.notFound');
    }

    ctx.body = sanitize(file);
  },

  async count(ctx) {
    const method = _.has(ctx.query, '_q') ? 'countSearch' : 'count';

    ctx.body = await strapi.plugins.upload.services.upload[method](ctx.query);
  },

  async destroy(ctx) {
    const {
      params: { id },
    } = ctx;

    const file = await strapi.plugins['upload'].services.upload.findOne({ id });

    if (!file) {
      return ctx.notFound('file.notFound');
    }

    await strapi.plugins['upload'].services.upload.remove(file);

    ctx.body = sanitize(file);
  },

  async updateSettings(ctx) {
    const {
      request: { body },
    } = ctx;

    const data = await validateSettings(body);

    await strapi.plugins.upload.services.upload.setSettings(data);

    ctx.body = { data };
  },

  async getSettings(ctx) {
    const data = await strapi.plugins.upload.services.upload.getSettings();

    ctx.body = { data };
  },

  async updateFileInfo(ctx) {
    const {
      query: { id },
      request: { body },
    } = ctx;
    const data = await validateUploadBody(body);

    const result = await strapi.plugins.upload.services.upload.updateFileInfo(id, data.fileInfo);

    ctx.body = sanitize(result);
  },

  async replaceFile(ctx) {
    const {
      query: { id },
      request: { body, files: { files } = {} },
    } = ctx;

    // cannot replace with more than one file
    if (Array.isArray(files)) {
      throw strapi.errors.badRequest(null, {
        errors: [
          { id: 'Upload.replace.single', message: 'Cannot replace a file with multiple ones' },
        ],
      });
    }

    const replacedFiles = await strapi.plugins.upload.services.upload.replace(id, {
      data: await validateUploadBody(body),
      file: files,
    });

    ctx.body = sanitize(replacedFiles);
  },

  async uploadFiles(ctx) {
    const {
      request: { body, files: { files } = {} },
    } = ctx;

    const uploadedFiles = await strapi.plugins.upload.services.upload.upload({
      data: await validateUploadBody(body),
      files,
    });

    ctx.body = sanitize(uploadedFiles);
  },
};
