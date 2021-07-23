'use strict';

const { pick, uniq, prop, getOr, flatten, pipe, map } = require('lodash/fp');
const { contentTypes: contentTypesUtils } = require('@strapi/utils');
const { getService } = require('../utils');
const { validateGetNonLocalizedAttributesInput } = require('../validation/content-types');

const { PUBLISHED_AT_ATTRIBUTE } = contentTypesUtils.constants;

const getLocalesProperty = getOr([], 'properties.locales');
const getFieldsProperty = prop('properties.fields');

const getFirstLevelPath = map(path => path.split('.')[0]);

module.exports = {
  async getNonLocalizedAttributes(ctx) {
    const { user } = ctx.state;
    const { model, id, locale } = ctx.request.body;

    try {
      await validateGetNonLocalizedAttributesInput({ model, id, locale });
    } catch (err) {
      return ctx.badRequest('ValidationError', err);
    }

    const modelDef = strapi.getModel(model);
    const { copyNonLocalizedAttributes, isLocalizedContentType } = getService('content-types');
    const { READ_ACTION, CREATE_ACTION } = strapi.admin.services.constants;

    if (!isLocalizedContentType(modelDef)) {
      return ctx.badRequest('model.not.localized');
    }

    let params = modelDef.kind === 'singleType' ? {} : { id };

    const entity = await strapi
      .query(model)
      .findOne({ where: params, populate: ['localizations'] });

    if (!entity) {
      return ctx.notFound();
    }

    const permissions = await strapi.admin.services.permission.findMany({
      where: {
        action: [READ_ACTION, CREATE_ACTION],
        subject: model,
        role: {
          id: user.roles.map(prop('id')),
        },
      },
    });

    const localePermissions = permissions
      .filter(perm => getLocalesProperty(perm).includes(locale))
      .map(getFieldsProperty);

    const permittedFields = pipe(flatten, getFirstLevelPath, uniq)(localePermissions);

    const nonLocalizedFields = copyNonLocalizedAttributes(modelDef, entity);
    const sanitizedNonLocalizedFields = pick(permittedFields, nonLocalizedFields);

    ctx.body = {
      nonLocalizedFields: sanitizedNonLocalizedFields,
      localizations: entity.localizations.concat(
        pick(['id', 'locale', PUBLISHED_AT_ATTRIBUTE], entity)
      ),
    };
  },
};
