'use strict';

// FIXME
/* eslint-disable import/extensions */
const Sentry = require('@sentry/node');
const defaultSettings = require('../config/settings.json');

const createSentryService = () => {
  let isReady = false;
  let instance = null;
  let settings = {};

  return {
    /**
     * Initialize Sentry service
     */
    init() {
      // Make sure there isn't a Sentry instance already running
      if (instance != null) {
        return this;
      }

      // Retrieve user settings and merge them with the default ones
      settings = {
        ...defaultSettings,
        ...strapi.plugins.sentry.config,
      };

      try {
        // Don't init Sentry if no DSN was provided
        if (settings.dsn) {
          Sentry.init({
            dsn: settings.dsn,
            environment: strapi.config.environment,
            ...settings.init,
          });
          // Store the successfully initialized Sentry instance
          instance = Sentry;
          isReady = true;
        } else {
          strapi.log.info('@strapi/plugin-sentry is disabled because no Sentry DSN was provided');
        }
      } catch (error) {
        strapi.log.warn('Could not set up Sentry, make sure you entered a valid DSN');
      }

      return this;
    },

    /**
     * Expose Sentry instance through a getter
     * @returns {Sentry}
     */
    getInstance() {
      return instance;
    },

    /**
     * Callback to [configure an instance of Sentry's scope]{@link https://docs.sentry.io/platforms/node/enriching-events/scopes/#configuring-the-scope}
     * @callback configureScope
     * @param {Sentry.scope} scope
     * @param {Sentry=} instance An initialized Sentry instance
     */

    /**
     * Higher level method to send exception events to Sentry
     * @param {Error} error An error object
     * @param {configureScope=} configureScope
     */
    sendError(error, configureScope) {
      // Make sure Sentry is ready
      if (!isReady) {
        strapi.log.warn("Sentry wasn't properly initialized, cannot send event");
        return;
      }

      instance.withScope(scope => {
        // Configure the Sentry scope using the provided callback
        if (configureScope && settings.sendMetadata) {
          configureScope(scope, instance);
        }
        // Actually send the Error to Sentry
        instance.captureException(error);
      });
    },
  };
};

module.exports = createSentryService();
