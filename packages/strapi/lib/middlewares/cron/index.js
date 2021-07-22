'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const _ = require('lodash');
const cron = require('node-schedule');

/**
 * CRON hook
 */

module.exports = strapi => {
  return {
    /**
     * Initialize the hook
     */

    initialize() {
      const scheduleTask = (taskExpression, taskValue) => {
        if (_.isFunction(taskValue)) {
          return cron.scheduleJob(taskExpression, taskValue);
        }

        const options = _.get(taskValue, 'options', {});

        cron.scheduleJob(
          {
            rule: taskExpression,
            ...options,
          },
          taskValue.task,
        );
      };

      if (strapi.config.get('server.cron.enabled', false) === true) {
        _.forEach(_.entries(strapi.config.get('functions.cron', {})), ([taskExpression, taskValue]) => {
          scheduleTask(taskExpression, taskValue);
        });

        _.forEach(_.keys(strapi.plugins), pluginName => {
          const pluginCron = _.get(strapi.plugins[pluginName], ['config', 'functions', 'cron']);

          if (pluginCron) {
            _.forEach(_.entries(pluginCron), ([taskExpression, taskValue]) => {
              scheduleTask(taskExpression, taskValue);
            });
          }
        });
      }
    },
  };
};

