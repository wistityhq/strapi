'use strict';
// FIXME
/* eslint-disable import/extensions */
const INVALID_DSN = 'an_invalid_dsn';
const VALID_DSN = 'a_valid_dsn';
const captureException = jest.fn();

jest.mock('@sentry/node', () => {
  return {
    init(options = {}) {
      if (options.dsn !== VALID_DSN) {
        throw Error();
      }
    },
    captureException,
    withScope(configureScope) {
      configureScope();
    },
  };
});

let sentryService = require('../sentry');
const defaultConfig = require('../../config/settings.json');

describe('Sentry service', () => {
  beforeEach(() => {
    // Reset Strapi state
    global.strapi = {
      config: {},
      plugins: {
        sentry: {
          config: defaultConfig,
        },
      },
      log: {
        warn: jest.fn(),
        info: jest.fn(),
      },
    };
    sentryService = require('../sentry');
  });

  afterEach(() => {
    // Reset the plugin resource state
    jest.resetModules();
  });

  it('disables Sentry when no DSN is provided', () => {
    sentryService.init();
    expect(strapi.log.info).toHaveBeenCalledWith(expect.stringMatching(/disabled/i));

    const instance = sentryService.getInstance();
    expect(instance).toBeNull();
  });

  it('disables Sentry when an invalid DSN is provided', () => {
    global.strapi.plugins.sentry.config = {
      dsn: INVALID_DSN,
    };
    sentryService.init();
    expect(strapi.log.warn).toHaveBeenCalledWith(expect.stringMatching(/could not set up sentry/i));

    const instance = sentryService.getInstance();
    expect(instance).toBeNull();
  });

  it("doesn't send events before init", () => {
    sentryService.sendError(Error());
    expect(strapi.log.warn).toHaveBeenCalledWith(expect.stringMatching(/cannot send event/i));
  });

  it('initializes and sends errors', () => {
    global.strapi.plugins.sentry.config = {
      dsn: VALID_DSN,
    };
    sentryService.init();

    // Saves the instance correctly
    const instance = sentryService.getInstance();
    expect(instance).not.toBeNull();

    // Doesn't allow re-init
    sentryService.init();

    // Send error
    const error = Error('an error');
    const configureScope = jest.fn();
    sentryService.sendError(error, configureScope);
    expect(configureScope).toHaveBeenCalled();
    expect(captureException).toHaveBeenCalled();
  });

  it('does not not send metadata when the option is disabled', () => {
    // Init with metadata option disabled
    global.strapi.plugins.sentry.config = {
      dsn: VALID_DSN,
      sendMetadata: false,
    };
    sentryService.init();

    // Send error
    const error = Error('an error');
    const configureScope = jest.fn();
    sentryService.sendError(error, configureScope);
    expect(configureScope).not.toHaveBeenCalled();
  });
});
