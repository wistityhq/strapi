'use strict';

const http = require('http');
const path = require('path');
const fse = require('fs-extra');
const Koa = require('koa');
const Router = require('koa-router');
const _ = require('lodash');
const chalk = require('chalk');
const CLITable = require('cli-table3');
const { models, getAbsoluteAdminUrl, getAbsoluteServerUrl } = require('@strapi/utils');
const { createLogger } = require('@strapi/logger');
const { Database } = require('@strapi/database');
const loadConfiguration = require('./core/app-configuration');

const utils = require('./utils');
const loadModules = require('./core/loaders/load-modules');
const bootstrap = require('./core/loaders/bootstrap');
const initializeMiddlewares = require('./middlewares');
const initializeHooks = require('./hooks');
const createStrapiFs = require('./core/fs');
const createEventHub = require('./services/event-hub');
const createWebhookRunner = require('./services/webhook-runner');
const { webhookModel, createWebhookStore } = require('./services/webhook-store');
const { createCoreStore, coreStoreModel } = require('./services/core-store');
const createEntityService = require('./services/entity-service');
const entityValidator = require('./services/entity-validator');
const createTelemetry = require('./services/metrics');
const createUpdateNotifier = require('./utils/update-notifier');
const ee = require('./utils/ee');
const createContainer = require('./core/container');
const createConfigProvider = require('./core/base-providers/config-provider');

const LIFECYCLES = {
  REGISTER: 'register',
  BOOTSTRAP: 'bootstrap',
};

class Strapi {
  constructor(opts = {}) {
    this.reload = this.reload();

    // Expose `koa`.
    this.app = new Koa();
    this.router = new Router();

    this.initServer();

    // Utils.
    this.utils = {
      models,
    };

    this.dir = opts.dir || process.cwd();

    this.admin = {};
    this.plugins = {};

    const appConfig = loadConfiguration(this.dir, opts);
    this.config = createConfigProvider(appConfig);
    this.container = createContainer(this);
    this.app.proxy = this.config.get('server.proxy');

    // Logger.
    const loggerUserConfiguration = this.config.get('logger', {});
    this.log = createLogger(loggerUserConfiguration);

    this.isLoaded = false;

    // internal services.
    this.fs = createStrapiFs(this);
    this.eventHub = createEventHub();

    this.requireProjectBootstrap();

    createUpdateNotifier(this).notify();
  }

  get EE() {
    return ee({ dir: this.dir, logger: this.log });
  }

  handleRequest(req, res) {
    if (!this.requestHandler) {
      this.requestHandler = this.app.callback();
    }

    return this.requestHandler(req, res);
  }

  requireProjectBootstrap() {
    const bootstrapPath = path.resolve(this.dir, 'config/functions/bootstrap.js');

    if (fse.existsSync(bootstrapPath)) {
      require(bootstrapPath);
    }
  }

  logStats() {
    const columns = Math.min(process.stderr.columns, 80) - 2;
    console.log();
    console.log(chalk.black.bgWhite(_.padEnd(' Project information', columns)));
    console.log();

    const infoTable = new CLITable({
      colWidths: [20, 50],
      chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
    });

    const isEE = strapi.EE === true && ee.isEE === true;

    infoTable.push(
      [chalk.blue('Time'), `${new Date()}`],
      [chalk.blue('Launched in'), Date.now() - this.config.launchedAt + ' ms'],
      [chalk.blue('Environment'), this.config.environment],
      [chalk.blue('Process PID'), process.pid],
      [chalk.blue('Version'), `${this.config.get('info.strapi')} (node ${process.version})`],
      [chalk.blue('Edition'), isEE ? 'Enterprise' : 'Community']
    );

    console.log(infoTable.toString());
    console.log();
    console.log(chalk.black.bgWhite(_.padEnd(' Actions available', columns)));
    console.log();
  }

  logFirstStartupMessage() {
    this.logStats();

    console.log(chalk.bold('One more thing...'));
    console.log(
      chalk.grey('Create your first administrator 💻 by going to the administration panel at:')
    );
    console.log();

    const addressTable = new CLITable();

    const adminUrl = getAbsoluteAdminUrl(strapi.config);
    addressTable.push([chalk.bold(adminUrl)]);

    console.log(`${addressTable.toString()}`);
    console.log();
  }

  logStartupMessage() {
    this.logStats();

    console.log(chalk.bold('Welcome back!'));

    if (this.config.serveAdminPanel === true) {
      console.log(chalk.grey('To manage your project 🚀, go to the administration panel at:'));
      const adminUrl = getAbsoluteAdminUrl(strapi.config);
      console.log(chalk.bold(adminUrl));
      console.log();
    }

    console.log(chalk.grey('To access the server ⚡️, go to:'));
    const serverUrl = getAbsoluteServerUrl(strapi.config);
    console.log(chalk.bold(serverUrl));
    console.log();
  }

  initServer() {
    this.server = http.createServer(this.handleRequest.bind(this));
    // handle port in use cleanly
    this.server.on('error', err => {
      if (err.code === 'EADDRINUSE') {
        return this.stopWithError(`The port ${err.port} is already used by another application.`);
      }

      this.log.error(err);
    });

    // Close current connections to fully destroy the server
    const connections = {};

    this.server.on('connection', conn => {
      const key = conn.remoteAddress + ':' + conn.remotePort;
      connections[key] = conn;

      conn.on('close', function() {
        delete connections[key];
      });
    });

    this.server.destroy = cb => {
      this.server.close(cb);

      for (let key in connections) {
        connections[key].destroy();
      }
    };
  }

  async start(cb) {
    try {
      if (!this.isLoaded) {
        await this.load();
      }

      this.app.use(this.router.routes()).use(this.router.allowedMethods());

      // Launch server.
      this.listen(cb);
    } catch (err) {
      this.stopWithError(err);
    }
  }

  async destroy() {
    if (_.has(this, 'server.destroy')) {
      await new Promise(res => this.server.destroy(res));
    }

    await Promise.all(
      Object.values(this.plugins).map(plugin => {
        if (_.has(plugin, 'destroy') && typeof plugin.destroy === 'function') {
          return plugin.destroy();
        }
      })
    );

    if (_.has(this, 'admin')) {
      await this.admin.destroy();
    }

    this.eventHub.removeAllListeners();

    if (_.has(this, 'db')) {
      await this.db.destroy();
    }

    this.telemetry.destroy();

    delete global.strapi;
  }

  /**
   * Add behaviors to the server
   */
  async listen(cb) {
    const onListen = async err => {
      if (err) return this.stopWithError(err);

      // Is the project initialised?
      const isInitialised = await utils.isInitialised(this);

      // Should the startup message be displayed?
      const hideStartupMessage = process.env.STRAPI_HIDE_STARTUP_MESSAGE
        ? process.env.STRAPI_HIDE_STARTUP_MESSAGE === 'true'
        : false;

      if (hideStartupMessage === false) {
        if (!isInitialised) {
          this.logFirstStartupMessage();
        } else {
          this.logStartupMessage();
        }
      }

      // Get database clients
      const databaseClients = _.map(this.config.get('connections'), _.property('settings.client'));

      // Emit started event.
      await this.telemetry.send('didStartServer', {
        database: databaseClients,
        plugins: this.config.installedPlugins,
        providers: this.config.installedProviders,
      });

      if (cb && typeof cb === 'function') {
        cb();
      }

      // if (
      //   (this.config.environment === 'development' &&
      //     this.config.get('server.admin.autoOpen', true) !== false) ||
      //   !isInitialised
      // ) {
      //   await utils.openBrowser.call(this);
      // }
    };

    const listenSocket = this.config.get('server.socket');
    const listenErrHandler = err => onListen(err).catch(err => this.stopWithError(err));

    if (listenSocket) {
      this.server.listen(listenSocket, listenErrHandler);
    } else {
      this.server.listen(
        this.config.get('server.port'),
        this.config.get('server.host'),
        listenErrHandler
      );
    }
  }

  stopWithError(err, customMessage) {
    console.log(err);
    this.log.debug(`⛔️ Server wasn't able to start properly.`);
    if (customMessage) {
      this.log.error(customMessage);
    }

    this.log.error(err);
    return this.stop();
  }

  stop(exitCode = 1) {
    // Destroy server and available connections.
    if (_.has(this, 'server.destroy')) {
      this.server.destroy();
    }

    if (this.config.get('autoReload')) {
      process.send('stop');
    }

    // Kill process
    process.exit(exitCode);
  }

  async load() {
    this.app.use(async (ctx, next) => {
      if (ctx.request.url === '/_health' && ['HEAD', 'GET'].includes(ctx.request.method)) {
        ctx.set('strapi', 'You are so French!');
        ctx.status = 204;
      } else {
        await next();
      }
    });

    await this.container.load();

    const modules = await loadModules(this);

    this.plugins = this.container.plugins.getAll();

    this.api = modules.api;
    this.admin = modules.admin;
    this.components = modules.components;

    this.middleware = modules.middlewares;
    this.hook = modules.hook;

    await bootstrap(this);

    // init webhook runner
    this.webhookRunner = createWebhookRunner({
      eventHub: this.eventHub,
      logger: this.log,
      configuration: this.config.get('server.webhooks', {}),
    });

    // Init core store

    await this.runLifecyclesFunctions(LIFECYCLES.REGISTER);

    // TODO: i18N must have added the new fileds before we init the DB

    const contentTypes = [
      // todo: move corestore and webhook to real models instead of content types to avoid adding extra attributes
      coreStoreModel,
      webhookModel,
      ...Object.values(strapi.contentTypes),
      ...Object.values(strapi.components),
    ];

    // TODO: create in RootProvider
    this.db = await Database.init({
      ...this.config.get('database'),
      models: Database.transformContentTypes(contentTypes),
    });

    await this.db.schema.sync();

    this.store = createCoreStore({
      environment: this.config.environment,
      db: this.db,
    });

    this.webhookStore = createWebhookStore({ db: this.db });

    await this.startWebhooks();

    this.entityValidator = entityValidator;

    this.entityService = createEntityService({
      strapi: this,
      db: this.db,
      eventHub: this.eventHub,
      entityValidator: this.entityValidator,
    });

    this.telemetry = createTelemetry(this);

    // Initialize hooks and middlewares.
    await initializeMiddlewares.call(this);
    await initializeHooks.call(this);

    await this.runLifecyclesFunctions(LIFECYCLES.BOOTSTRAP);

    await this.freeze();

    this.isLoaded = true;
    return this;
  }

  async startWebhooks() {
    const webhooks = await this.webhookStore.findWebhooks();
    webhooks.forEach(webhook => this.webhookRunner.add(webhook));
  }

  reload() {
    const state = {
      shouldReload: 0,
    };

    const reload = function() {
      if (state.shouldReload > 0) {
        // Reset the reloading state
        state.shouldReload -= 1;
        reload.isReloading = false;
        return;
      }

      if (this.config.autoReload) {
        this.server.close();
        process.send('reload');
      }
    };

    Object.defineProperty(reload, 'isWatching', {
      configurable: true,
      enumerable: true,
      set: value => {
        // Special state when the reloader is disabled temporarly (see GraphQL plugin example).
        if (state.isWatching === false && value === true) {
          state.shouldReload += 1;
        }
        state.isWatching = value;
      },
      get: () => {
        return state.isWatching;
      },
    });

    reload.isReloading = false;
    reload.isWatching = true;

    return reload;
  }

  async runBootstraps() {
    for (const plugin of this.plugin.getAll()) {
      await plugin.bootstrap(this);
    }
  }

  async runRegisters() {
    for (const plugin of this.plugin.getAll()) {
      await plugin.register(this);
    }
  }

  async runLifecyclesFunctions(lifecycleName) {
    const execLifecycle = async fn => {
      if (!fn) {
        return;
      }

      return fn();
    };

    const configPath = `functions.${lifecycleName}`;

    // plugins
    if (lifecycleName === LIFECYCLES.BOOTSTRAP) {
      await this.container.bootstrap();
    } else if (lifecycleName === LIFECYCLES.REGISTER) {
      await this.container.register();
    }

    // user
    await execLifecycle(this.config.get(configPath));

    // admin
    const adminFunc = _.get(this.admin.config, configPath);
    return execLifecycle(adminFunc).catch(err => {
      strapi.log.error(`${lifecycleName} function in admin failed`);
      console.error(err);
      strapi.stop();
    });
  }

  async freeze() {
    Object.freeze(this.config);
    Object.freeze(this.dir);
    Object.freeze(this.admin);
    Object.freeze(this.plugins);
    Object.freeze(this.api);
  }

  getModel(uid) {
    return this.contentTypes[uid] || this.components[uid];
  }

  /**
   * Binds queries with a specific model
   * @param {string} uid
   * @returns {}
   */
  query(uid) {
    return this.db.query(uid);
  }
}

module.exports = options => {
  const strapi = new Strapi(options);
  global.strapi = strapi;
  return strapi;
};

module.exports.Strapi = Strapi;
