'use strict';

/**
 * Documentation.js controller
 *
 * @description: A set of functions called "actions" of the `documentation` plugin.
 */

// Core dependencies.
const path = require('path');

// Public dependencies.
const fs = require('fs-extra');
const cheerio = require('cheerio');
const _ = require('lodash');
const koaStatic = require('koa-static');

module.exports = {
  getInfos: async ctx => {
    try {
      const service = strapi.plugins.documentation.services.documentation;
      const docVersions = service.retrieveDocumentationVersions();
      const form = await service.retrieveFrontForm();

      ctx.send({
        docVersions,
        currentVersion: service.getDocumentationVersion(),
        prefix: strapi.config.get('plugins.documentation.x-strapi-config').path,
        form,
      });
    } catch (err) {
      ctx.badRequest(null, err.message);
    }
  },

  async index(ctx, next) {
    try {
      /**
       * We don't expose the specs using koa-static or something else due to security reasons.
       * That's why, we need to read the file localy and send the specs through it when we serve the Swagger UI.
       */
      const { major, minor, patch } = ctx.params;
      const version =
        major && minor && patch
          ? `${major}.${minor}.${patch}`
          : strapi.plugins.documentation.config.info.version;
      const openAPISpecsPath = path.join(
        strapi.config.appPath,
        'extensions',
        'documentation',
        'documentation',
        version,
        'full_documentation.json'
      );

      try {
        const documentation = fs.readFileSync(openAPISpecsPath, 'utf8');
        const layout = fs.readFileSync(
          path.resolve(__dirname, '..', 'public', 'index.html'),
          'utf8'
        );
        const filledLayout = _.template(layout)({
          backendUrl: strapi.config.server.url,
          spec: JSON.stringify(JSON.parse(documentation)),
        });

        try {
          const layoutPath = path.resolve(
            strapi.config.appPath,
            'extensions',
            'documentation',
            'public',
            'index.html'
          );
          await fs.ensureFile(layoutPath);
          await fs.writeFile(layoutPath, filledLayout);

          // Serve the file.
          ctx.url = path.basename(`${ctx.url}/index.html`);

          try {
            const staticFolder = path.resolve(
              strapi.config.appPath,
              'extensions',
              'documentation',
              'public'
            );
            return await koaStatic(staticFolder)(ctx, next);
          } catch (e) {
            strapi.log.error(e);
          }
        } catch (e) {
          strapi.log.error(e);
        }
      } catch (e) {
        strapi.log.error(e);
      }
    } catch (e) {
      strapi.log.error(e);
    }
  },

  async loginView(ctx, next) {
    const { error } = ctx.query;

    try {
      const layout = fs.readFileSync(path.join(__dirname, '..', 'public', 'login.html'));
      const filledLayout = _.template(layout)({
        actionUrl: `${strapi.config.server.url}${
          strapi.config.get('plugins.documentation.x-strapi-config').path
        }/login`,
      });
      const $ = cheerio.load(filledLayout);

      $('.error').text(_.isEmpty(error) ? '' : 'Wrong password...');

      try {
        const layoutPath = path.resolve(
          strapi.config.appPath,
          'extensions',
          'documentation',
          'public',
          'login.html'
        );
        await fs.ensureFile(layoutPath);
        await fs.writeFile(layoutPath, $.html());

        ctx.url = path.basename(`${ctx.url}/login.html`);

        try {
          const staticFolder = path.resolve(
            strapi.config.appPath,
            'extensions',
            'documentation',
            'public'
          );
          return await koaStatic(staticFolder)(ctx, next);
        } catch (e) {
          strapi.log.error(e);
        }
      } catch (e) {
        strapi.log.error(e);
      }
    } catch (e) {
      strapi.log.error(e);
    }
  },

  async login(ctx) {
    const {
      body: { password },
    } = ctx.request;

    const { password: storedPassword } = await strapi
      .store({
        environment: '',
        type: 'plugin',
        name: 'documentation',
        key: 'config',
      })
      .get();

    const isValid = await strapi.plugins['users-permissions'].services.user.validatePassword(
      password,
      storedPassword
    );
    let querystring = '?error=password';

    if (isValid) {
      ctx.session.documentation = password;
      querystring = '';
    }

    ctx.redirect(
      `${strapi.config.server.url}${
        strapi.config.get('plugins.documentation.x-strapi-config').path
      }${querystring}`
    );
  },

  regenerateDoc: async ctx => {
    const service = strapi.plugins.documentation.services.documentation;
    const documentationVersions = service.retrieveDocumentationVersions().map(el => el.version);
    const {
      request: {
        body: { version },
        admin,
      },
    } = ctx;

    if (_.isEmpty(version)) {
      return ctx.badRequest(
        null,
        admin ? 'documentation.error.noVersion' : 'Please provide a version.'
      );
    }

    if (!documentationVersions.includes(version)) {
      return ctx.badRequest(
        null,
        admin
          ? 'documentation.error.regenerateDoc.versionMissing'
          : 'The version you are trying to generate does not exist.'
      );
    }

    try {
      strapi.reload.isWatching = false;
      const fullDoc = service.generateFullDoc(version);
      const documentationPath = service.getMergedDocumentationPath(version);
      // Write the file
      fs.writeFileSync(
        path.resolve(documentationPath, 'full_documentation.json'),
        JSON.stringify(fullDoc, null, 2),
        'utf8'
      );
      ctx.send({ ok: true });
    } catch (err) {
      ctx.badRequest(null, admin ? 'documentation.error.regenerateDoc' : 'An error occured');
    } finally {
      strapi.reload.isWatching = true;
    }
  },

  deleteDoc: async ctx => {
    strapi.reload.isWatching = false;
    const service = strapi.plugins.documentation.services.documentation;
    const documentationVersions = service.retrieveDocumentationVersions().map(el => el.version);

    const {
      params: { version },
      request: { admin },
    } = ctx;

    if (_.isEmpty(version)) {
      return ctx.badRequest(
        null,
        admin ? 'documentation.error.noVersion' : 'Please provide a version.'
      );
    }

    if (!documentationVersions.includes(version)) {
      return ctx.badRequest(
        null,
        admin
          ? 'documentation.error.deleteDoc.versionMissing'
          : 'The version you are trying to delete does not exist.'
      );
    }

    try {
      await service.deleteDocumentation(version);
      ctx.send({ ok: true });
    } catch (err) {
      ctx.badRequest(null, admin ? 'notification.error' : err.message);
    } finally {
      strapi.reload.isWatching = true;
    }
  },

  updateSettings: async ctx => {
    const {
      admin,
      body: { restrictedAccess, password },
    } = ctx.request;
    const usersPermService = strapi.plugins['users-permissions'].services;
    const pluginStore = strapi.store({
      environment: '',
      type: 'plugin',
      name: 'documentation',
    });
    const prevConfig = await pluginStore.get({ key: 'config' });

    if (restrictedAccess && _.isEmpty(password)) {
      return ctx.badRequest(
        null,
        admin ? 'users-permissions.Auth.form.error.password.provide' : 'Please provide a password'
      );
    }

    const isNewPassword = !_.isEmpty(password) && password !== prevConfig.password;

    if (isNewPassword && usersPermService.user.isHashed(password)) {
      // Throw an error if the password selected by the user
      // contains more than two times the symbol '$'.
      return ctx.badRequest(
        null,
        admin
          ? 'users-permissions.Auth.form.error.password.format'
          : 'our password cannot contain more than three times the symbol `$`.'
      );
    }

    if (isNewPassword) {
      prevConfig.password = await usersPermService.user.hashPassword({
        password,
      });
    }

    _.set(prevConfig, 'restrictedAccess', restrictedAccess);

    await pluginStore.set({ key: 'config', value: prevConfig });

    return ctx.send({ ok: true });
  },
};
