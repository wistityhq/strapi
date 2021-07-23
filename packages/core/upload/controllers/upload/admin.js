'use strict';

const _ = require('lodash');
const { contentTypes: contentTypesUtils } = require('@strapi/utils');
const validateSettings = require('../validation/settings');
const validateUploadBody = require('../validation/upload');
const { getService } = require('../../utils');

const { CREATED_BY_ATTRIBUTE } = contentTypesUtils.constants;

const ACTIONS = {
  read: 'plugins::upload.read',
  readSettings: 'plugins::upload.settings.read',
  create: 'plugins::upload.assets.create',
  update: 'plugins::upload.assets.update',
  download: 'plugins::upload.assets.download',
  copyLink: 'plugins::upload.assets.copy-link',
};

const fileModel = 'plugins::upload.file';

module.exports = {
  async find(ctx) {
    const {
      state: { userAbility },
    } = ctx;

    const pm = strapi.admin.services.permission.createPermissionsManager({
      ability: userAbility,
      action: ACTIONS.read,
      model: fileModel,
    });

    if (!pm.isAllowed) {
      return ctx.forbidden();
    }

    const method = _.has(ctx.query, '_q') ? 'search' : 'fetchAll';

    const query = pm.queryFrom(ctx.query);
    const files = await getService('upload')[method](query, []);

    ctx.body = pm.sanitize(files, { withPrivate: false });
  },

  async findOne(ctx) {
    const {
      state: { userAbility },
      params: { id },
    } = ctx;

    const { pm, file } = await findEntityAndCheckPermissions(
      userAbility,
      ACTIONS.read,
      fileModel,
      id
    );

    ctx.body = pm.sanitize(file, { withPrivate: false });
  },

  async count(ctx) {
    const pm = strapi.admin.services.permission.createPermissionsManager({
      ability: ctx.state.userAbility,
      action: ACTIONS.read,
      model: fileModel,
    });

    if (!pm.isAllowed) {
      return ctx.forbidden();
    }

    const method = _.has(ctx.query, '_q') ? 'countSearch' : 'count';
    const query = pm.queryFrom(ctx.query);

    const count = await getService('upload')[method](query);

    ctx.body = { count };
  },

  async destroy(ctx) {
    const {
      state: { userAbility },
      params: { id },
    } = ctx;

    const { pm, file } = await findEntityAndCheckPermissions(
      userAbility,
      ACTIONS.update,
      fileModel,
      id
    );

    await strapi.plugins['upload'].services.upload.remove(file);

    ctx.body = pm.sanitize(file, { action: ACTIONS.read, withPrivate: false });
  },

  async updateSettings(ctx) {
    const {
      request: { body },
      state: { userAbility },
    } = ctx;

    if (userAbility.cannot(ACTIONS.readSettings, fileModel)) {
      return ctx.forbidden();
    }

    const data = await validateSettings(body);

    await getService('upload').setSettings(data);

    ctx.body = { data };
  },

  async getSettings(ctx) {
    const {
      state: { userAbility },
    } = ctx;

    if (userAbility.cannot(ACTIONS.readSettings, fileModel)) {
      return ctx.forbidden();
    }

    const data = await getService('upload').getSettings();

    ctx.body = { data };
  },

  async updateFileInfo(ctx) {
    const {
      state: { userAbility, user },
      query: { id },
      request: { body },
    } = ctx;

    const uploadService = getService('upload');
    const { pm } = await findEntityAndCheckPermissions(userAbility, ACTIONS.update, fileModel, id);

    const data = await validateUploadBody(body);
    const file = await uploadService.updateFileInfo(id, data.fileInfo, { user });

    ctx.body = pm.sanitize(file, { action: ACTIONS.read, withPrivate: false });
  },

  async replaceFile(ctx) {
    const {
      state: { userAbility, user },
      query: { id },
      request: { body, files: { files } = {} },
    } = ctx;

    const uploadService = getService('upload');
    const { pm } = await findEntityAndCheckPermissions(userAbility, ACTIONS.update, fileModel, id);

    if (Array.isArray(files)) {
      throw strapi.errors.badRequest(null, {
        errors: [
          { id: 'Upload.replace.single', message: 'Cannot replace a file with multiple ones' },
        ],
      });
    }

    const data = await validateUploadBody(body);
    const replacedFiles = await uploadService.replace(id, { data, file: files }, { user });

    ctx.body = pm.sanitize(replacedFiles, { action: ACTIONS.read, withPrivate: false });
  },

  async uploadFiles(ctx) {
    const {
      state: { userAbility, user },
      request: { body, files: { files } = {} },
    } = ctx;

    const uploadService = getService('upload');
    const pm = strapi.admin.services.permission.createPermissionsManager({
      ability: userAbility,
      action: ACTIONS.create,
      model: fileModel,
    });

    if (!pm.isAllowed) {
      throw strapi.errors.forbidden();
    }

    const data = await validateUploadBody(body);
    const uploadedFiles = await uploadService.upload({ data, files }, { user });

    ctx.body = pm.sanitize(uploadedFiles, { action: ACTIONS.read, withPrivate: false });
  },
};

const findEntityAndCheckPermissions = async (ability, action, model, id) => {
  const file = await getService('upload').findOne({ id }, [CREATED_BY_ATTRIBUTE]);

  if (_.isNil(file)) {
    throw strapi.errors.notFound();
  }

  const pm = strapi.admin.services.permission.createPermissionsManager({ ability, action, model });

  const author = await strapi.admin.services.user.findOne({ id: file[CREATED_BY_ATTRIBUTE].id }, [
    'roles',
  ]);

  const fileWithRoles = _.set(_.cloneDeep(file), 'created_by', author);

  if (pm.ability.cannot(pm.action, pm.toSubject(fileWithRoles))) {
    throw strapi.errors.forbidden();
  }

  return { pm, file };
};
