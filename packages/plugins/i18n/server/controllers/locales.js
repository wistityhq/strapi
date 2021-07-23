'use strict';

const { setCreatorFields, sanitizeEntity } = require('@strapi/utils');
const { pick } = require('lodash/fp');
const { getService } = require('../utils');
const { validateCreateLocaleInput, validateUpdateLocaleInput } = require('../validation/locales');
const { formatLocale } = require('../domain/locale');

const sanitizeLocale = locale => {
  const model = strapi.getModel('plugins::i18n.locale');

  return sanitizeEntity(locale, { model });
};

module.exports = {
  async listLocales(ctx) {
    const localesService = getService('locales');

    const locales = await localesService.find();

    ctx.body = await localesService.setIsDefault(sanitizeLocale(locales));
  },

  async createLocale(ctx) {
    const { user } = ctx.state;
    const { body } = ctx.request;
    let { isDefault, ...localeToCreate } = body;

    try {
      await validateCreateLocaleInput(body);
    } catch (err) {
      return ctx.badRequest('ValidationError', err);
    }

    const localesService = getService('locales');

    const existingLocale = await localesService.findByCode(body.code);
    if (existingLocale) {
      return ctx.badRequest('This locale already exists');
    }

    localeToCreate = formatLocale(localeToCreate);
    localeToCreate = setCreatorFields({ user })(localeToCreate);

    const locale = await localesService.create(localeToCreate);

    if (isDefault) {
      await localesService.setDefaultLocale(locale);
    }

    ctx.body = await localesService.setIsDefault(sanitizeLocale(locale));
  },

  async updateLocale(ctx) {
    const { user } = ctx.state;
    const { id } = ctx.params;
    const { body } = ctx.request;
    let { isDefault, ...updates } = body;

    try {
      await validateUpdateLocaleInput(body);
    } catch (err) {
      return ctx.badRequest('ValidationError', err);
    }

    const localesService = getService('locales');

    const existingLocale = await localesService.findById(id);
    if (!existingLocale) {
      return ctx.notFound('locale.notFound');
    }

    const allowedParams = ['name'];
    const cleanUpdates = setCreatorFields({ user, isEdition: true })(pick(allowedParams, updates));

    const updatedLocale = await localesService.update({ id }, cleanUpdates);

    if (isDefault) {
      await localesService.setDefaultLocale(updatedLocale);
    }

    ctx.body = await localesService.setIsDefault(sanitizeLocale(updatedLocale));
  },

  async deleteLocale(ctx) {
    const { id } = ctx.params;

    const localesService = getService('locales');

    const existingLocale = await localesService.findById(id);
    if (!existingLocale) {
      return ctx.notFound('locale.notFound');
    }

    const defaultLocaleCode = await localesService.getDefaultLocale();
    if (existingLocale.code === defaultLocaleCode) {
      return ctx.badRequest('Cannot delete the default locale');
    }

    await localesService.delete({ id });

    ctx.body = await localesService.setIsDefault(sanitizeLocale(existingLocale));
  },
};
