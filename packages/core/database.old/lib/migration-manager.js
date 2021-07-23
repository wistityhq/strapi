'use strict';
const debug = require('debug')('strapi-database:migration');
const { isFunction, get } = require('lodash/fp');

class MigrationManager {
  constructor(db) {
    debug('Initialize migration manager');
    this.db = db;
    this.migrations = [];
  }

  register(migration) {
    debug('Register migration');
    this.migrations.push(migration);
  }

  async run(fn, options, context = {}) {
    debug('Run migration');
    await this.runBefore(options, context);
    await fn(options, context);
    await this.runAfter(options, context);
  }

  async shouldRun({ migration, step, options, context }) {
    const method = migration[step];
    const shouldRunMethod = get(`shouldRun.${step}`, migration, null);

    if (!isFunction(method)) {
      return false;
    }

    if (!isFunction(shouldRunMethod)) {
      return true;
    }

    return shouldRunMethod(options, context);
  }

  async runBefore(options, context) {
    debug('Run before migrations');

    for (const migration of this.migrations) {
      const willRunStep = await this.shouldRun({ migration, step: 'before', options, context });

      if (willRunStep) {
        await migration.before(options, context);
      }
    }
  }

  async runAfter(options, context) {
    debug('Run after migrations');

    for (const migration of this.migrations.slice(0).reverse()) {
      const willRunStep = await this.shouldRun({ migration, step: 'after', options, context });

      if (willRunStep) {
        await migration.after(options, context);
      }
    }
  }
}

module.exports = strapi => {
  return new MigrationManager(strapi);
};
