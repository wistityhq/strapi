'use strict';

/**
 * Upload.js controller
 *
 */

const _ = require('lodash');
const { sanitizeEntity } = require('@strapi/utils');
const apiUploadController = require('./upload/api');
const adminUploadController = require('./upload/admin');

const resolveController = ctx => {
  const {
    state: { isAuthenticatedAdmin },
  } = ctx;

  return isAuthenticatedAdmin ? adminUploadController : apiUploadController;
};

const resolveControllerMethod = method => ctx => {
  const controller = resolveController(ctx);
  const callbackFn = controller[method];

  if (!_.isFunction(callbackFn)) {
    return ctx.notFound();
  }

  return callbackFn(ctx);
};

module.exports = {
  find: resolveControllerMethod('find'),
  findOne: resolveControllerMethod('findOne'),
  count: resolveControllerMethod('count'),
  destroy: resolveControllerMethod('destroy'),
  updateSettings: resolveControllerMethod('updateSettings'),
  getSettings: resolveControllerMethod('getSettings'),

  async upload(ctx) {
    const isUploadDisabled = _.get(strapi.plugins, 'upload.config.enabled', true) === false;

    if (isUploadDisabled) {
      throw strapi.errors.badRequest(null, {
        errors: [{ id: 'Upload.status.disabled', message: 'File upload is disabled' }],
      });
    }

    const {
      query: { id },
      request: { files: { files } = {} },
    } = ctx;
    const controller = resolveController(ctx);

    if (id && (_.isEmpty(files) || files.size === 0)) {
      return controller.updateFileInfo(ctx);
    }

    if (_.isEmpty(files) || files.size === 0) {
      throw strapi.errors.badRequest(null, {
        errors: [{ id: 'Upload.status.empty', message: 'Files are empty' }],
      });
    }

    await (id ? controller.replaceFile : controller.uploadFiles)(ctx);
  },

  async search(ctx) {
    const { id } = ctx.params;
    const model = strapi.getModel('plugins::upload.file');
    const entries = await strapi.query('plugins::upload.file').findMany({
      where: {
        $or: [{ hash: { $contains: id } }, { name: { $contains: id } }],
      },
    });

    ctx.body = sanitizeEntity(entries, { model });
  },
};
