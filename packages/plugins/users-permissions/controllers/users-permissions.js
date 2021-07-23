'use strict';

const _ = require('lodash');
const { getService } = require('../utils');
const { isValidEmailTemplate } = require('./validation/email-template');

module.exports = {
  /**
   * Default action.
   *
   * @return {Object}
   */
  async createRole(ctx) {
    if (_.isEmpty(ctx.request.body)) {
      return ctx.badRequest(null, [{ messages: [{ id: 'Cannot be empty' }] }]);
    }

    try {
      await getService('users-permissions').createRole(ctx.request.body);

      ctx.send({ ok: true });
    } catch (err) {
      strapi.log.error(err);
      ctx.badRequest(null, [{ messages: [{ id: 'An error occured' }] }]);
    }
  },

  async deleteRole(ctx) {
    // Fetch public role.
    const publicRole = await strapi
      .query('plugins::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    const publicRoleID = publicRole.id;

    const roleID = ctx.params.role;

    if (!roleID) {
      return ctx.badRequest(null, [{ messages: [{ id: 'Bad request' }] }]);
    }

    // Prevent from removing the public role.
    if (roleID.toString() === publicRoleID.toString()) {
      return ctx.badRequest(null, [{ messages: [{ id: 'Unauthorized' }] }]);
    }

    try {
      await getService('users-permissions').deleteRole(roleID, publicRoleID);

      ctx.send({ ok: true });
    } catch (err) {
      strapi.log.error(err);
      ctx.badRequest(null, [{ messages: [{ id: 'Bad request' }] }]);
    }
  },

  async getPermissions(ctx) {
    try {
      const permissions = await getService('users-permissions').getActions();

      ctx.send({ permissions });
    } catch (err) {
      ctx.badRequest(null, [{ message: [{ id: 'Not Found' }] }]);
    }
  },

  async getPolicies(ctx) {
    ctx.send({
      policies: _.without(
        _.keys(strapi.plugins['users-permissions'].config.policies),
        'permissions'
      ),
    });
  },

  async getRole(ctx) {
    const { id } = ctx.params;
    const { lang } = ctx.query;
    const plugins = await getService('users-permissions').getPlugins(lang);
    const role = await getService('users-permissions').getRole(id, plugins);

    if (_.isEmpty(role)) {
      return ctx.badRequest(null, [{ messages: [{ id: `Role don't exist` }] }]);
    }

    ctx.send({ role });
  },

  async getRoles(ctx) {
    try {
      const roles = await getService('users-permissions').getRoles();

      ctx.send({ roles });
    } catch (err) {
      ctx.badRequest(null, [{ messages: [{ id: 'Not found' }] }]);
    }
  },

  async getRoutes(ctx) {
    try {
      const routes = await getService('users-permissions').getRoutes();

      ctx.send({ routes });
    } catch (err) {
      ctx.badRequest(null, [{ messages: [{ id: 'Not found' }] }]);
    }
  },

  async index(ctx) {
    // Send 200 `ok`
    ctx.send({ message: 'ok' });
  },

  async searchUsers(ctx) {
    const { id } = ctx.params;

    const data = await strapi.query('plugins::users-permissions.user').custom(searchQueries)({
      id,
    });

    ctx.send(data);
  },

  async updateRole(ctx) {
    const roleID = ctx.params.role;

    if (_.isEmpty(ctx.request.body)) {
      return ctx.badRequest(null, [{ messages: [{ id: 'Bad request' }] }]);
    }

    try {
      await getService('users-permissions').updateRole(roleID, ctx.request.body);

      ctx.send({ ok: true });
    } catch (err) {
      strapi.log.error(err);
      ctx.badRequest(null, [{ messages: [{ id: 'An error occurred' }] }]);
    }
  },

  async getEmailTemplate(ctx) {
    ctx.send(
      await strapi
        .store({
          environment: '',
          type: 'plugin',
          name: 'users-permissions',
          key: 'email',
        })
        .get()
    );
  },

  async updateEmailTemplate(ctx) {
    if (_.isEmpty(ctx.request.body)) {
      return ctx.badRequest(null, [{ messages: [{ id: 'Cannot be empty' }] }]);
    }

    const emailTemplates = ctx.request.body['email-templates'];

    for (let key in emailTemplates) {
      const template = emailTemplates[key].options.message;

      if (!isValidEmailTemplate(template)) {
        return ctx.badRequest(null, [{ messages: [{ id: 'Invalid template' }] }]);
      }
    }

    await strapi
      .store({
        environment: '',
        type: 'plugin',
        name: 'users-permissions',
        key: 'email',
      })
      .set({ value: emailTemplates });

    ctx.send({ ok: true });
  },

  async getAdvancedSettings(ctx) {
    ctx.send({
      settings: await strapi
        .store({
          environment: '',
          type: 'plugin',
          name: 'users-permissions',
          key: 'advanced',
        })
        .get(),
      roles: await getService('users-permissions').getRoles(),
    });
  },

  async updateAdvancedSettings(ctx) {
    if (_.isEmpty(ctx.request.body)) {
      return ctx.badRequest(null, [{ messages: [{ id: 'Cannot be empty' }] }]);
    }

    await strapi
      .store({
        environment: '',
        type: 'plugin',
        name: 'users-permissions',
        key: 'advanced',
      })
      .set({ value: ctx.request.body });

    ctx.send({ ok: true });
  },

  async getProviders(ctx) {
    const providers = await strapi
      .store({
        environment: '',
        type: 'plugin',
        name: 'users-permissions',
        key: 'grant',
      })
      .get();

    for (const provider in providers) {
      if (provider !== 'email') {
        providers[provider].redirectUri = strapi.plugins[
          'users-permissions'
        ].services.providers.buildRedirectUri(provider);
      }
    }

    ctx.send(providers);
  },

  async updateProviders(ctx) {
    if (_.isEmpty(ctx.request.body)) {
      return ctx.badRequest(null, [{ messages: [{ id: 'Cannot be empty' }] }]);
    }

    await strapi
      .store({
        environment: '',
        type: 'plugin',
        name: 'users-permissions',
        key: 'grant',
      })
      .set({ value: ctx.request.body.providers });

    ctx.send({ ok: true });
  },
};

const searchQueries = {
  bookshelf({ model }) {
    return ({ id }) => {
      return model
        .query(function(qb) {
          qb.where('username', 'LIKE', `%${id}%`).orWhere('email', 'LIKE', `%${id}%`);
        })
        .fetchAll()
        .then(results => results.toJSON());
    };
  },
  mongoose({ model }) {
    return ({ id }) => {
      const re = new RegExp(id);

      return model.find({
        $or: [{ username: re }, { email: re }],
      });
    };
  },
};
