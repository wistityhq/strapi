'use strict';

/**
 * User.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const { sanitizeEntity, getAbsoluteServerUrl } = require('@strapi/utils');
const { getService } = require('../utils');

module.exports = ({ strapi }) => ({
  /**
   * Promise to count users
   *
   * @return {Promise}
   */

  count(params) {
    return strapi.query('plugins::users-permissions.user').count({ where: params });
  },

  /**
   * Promise to search count users
   *
   * @return {Promise}
   */

  // FIXME:
  countSearch(params) {
    return strapi.query('plugins::users-permissions.user').countSearch(params);
  },

  /**
   * Promise to add a/an user.
   * @return {Promise}
   */
  async add(values) {
    if (values.password) {
      values.password = await strapi.plugins['users-permissions'].services.user.hashPassword(
        values
      );
    }

    return strapi.query('plugins::users-permissions.user').create({ data: values });
  },

  /**
   * Promise to edit a/an user.
   * @return {Promise}
   */
  async edit(params, values) {
    if (values.password) {
      values.password = await getService('user').hashPassword(values);
    }

    return strapi.query('plugins::users-permissions.user').update({ where: params, data: values });
  },

  /**
   * Promise to fetch a/an user.
   * @return {Promise}
   */
  fetch(params, populate) {
    return strapi.query('plugins::users-permissions.user').findOne({ where: params, populate });
  },

  /**
   * Promise to fetch authenticated user.
   * @return {Promise}
   */
  fetchAuthenticatedUser(id) {
    return strapi
      .query('plugins::users-permissions.user')
      .findOne({ where: { id }, populate: ['role'] });
  },

  /**
   * Promise to fetch all users.
   * @return {Promise}
   */
  fetchAll(params, populate) {
    return strapi.query('plugins::users-permissions.user').findMany({ where: params, populate });
  },

  hashPassword(user = {}) {
    return new Promise((resolve, reject) => {
      if (!user.password || this.isHashed(user.password)) {
        resolve(null);
      } else {
        bcrypt.hash(`${user.password}`, 10, (err, hash) => {
          if (err) {
            return reject(err);
          }
          resolve(hash);
        });
      }
    });
  },

  isHashed(password) {
    if (typeof password !== 'string' || !password) {
      return false;
    }

    return password.split('$').length === 4;
  },

  /**
   * Promise to remove a/an user.
   * @return {Promise}
   */
  async remove(params) {
    return strapi.query('plugins::users-permissions.user').delete({ where: params });
  },

  async removeAll(params) {
    return strapi.query('plugins::users-permissions.user').delete({ where: params });
  },

  validatePassword(password, hash) {
    return bcrypt.compare(password, hash);
  },

  async sendConfirmationEmail(user) {
    const userPermissionService = strapi.plugins['users-permissions'].services.userspermissions;
    const pluginStore = await strapi.store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
    });

    const settings = await pluginStore
      .get({ key: 'email' })
      .then(storeEmail => storeEmail['email_confirmation'].options);

    const userInfo = sanitizeEntity(user, {
      model: strapi.getModel('plugins::users-permissions.user'),
    });

    const confirmationToken = crypto.randomBytes(20).toString('hex');

    await this.edit({ id: user.id }, { confirmationToken });

    settings.message = await userPermissionService.template(settings.message, {
      URL: `${getAbsoluteServerUrl(strapi.config)}/auth/email-confirmation`,
      USER: userInfo,
      CODE: confirmationToken,
    });

    settings.object = await userPermissionService.template(settings.object, { USER: userInfo });

    // Send an email to the user.
    await strapi.plugins['email'].services.email.send({
      to: user.email,
      from:
        settings.from.email && settings.from.name
          ? `${settings.from.name} <${settings.from.email}>`
          : undefined,
      replyTo: settings.response_email,
      subject: settings.object,
      text: settings.message,
      html: settings.message,
    });
  },
});
