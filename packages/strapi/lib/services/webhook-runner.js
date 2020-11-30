/**
 * The event hub is Strapi's event control center.
 */
'use strict';

const debug = require('debug')('strapi');
const _ = require('lodash');
const fetch = require('node-fetch');

const WorkerQueue = require('./worker-queue');

const defaultConfiguration = {
  defaultHeaders: {},
};

class WebhookRunner {
  constructor({ eventHub, logger, configuration = {} }) {
    debug('Initialized webhook runner');
    this.eventHub = eventHub;
    this.logger = logger;
    this.webhooksMap = new Map();
    this.listeners = new Map();

    if (typeof configuration !== 'object') {
      throw new Error(
        'Invalid configuration provided to the webhookRunner.\nCheck your server.json -> webhooks configuration'
      );
    }

    this.config = _.merge(defaultConfiguration, configuration);

    this.queue = new WorkerQueue({ logger, concurency: 5 });
    this.queue.subscribe(this.executeListener.bind(this));
  }

  deleteListener(event) {
    debug(`Deleting listener for event '${event}'`);
    if (this.listeners.has(event)) {
      const fn = this.listeners.get(event);

      this.eventHub.off(event, fn);
      this.listeners.delete(event);
    }
  }

  createListener(event) {
    debug(`Creating listener for event '${event}'`);
    if (this.listeners.has(event)) {
      this.logger.error(
        `The webhook runner is already listening for the event '${event}'. Did you mean to call .register() ?`
      );
    }

    const listen = info => {
      this.queue.enqueue({ event, info });
    };

    this.listeners.set(event, listen);
    this.eventHub.on(event, listen);
  }

  async executeListener({ event, info }) {
    debug(`Executing webhook for event '${event}'`);
    const webhooks = this.webhooksMap.get(event) || [];
    const activeWebhooks = webhooks.filter(webhook => webhook.isEnabled === true);

    for (const webhook of activeWebhooks) {
      await this.run(webhook, event, info).catch(error => {
        this.logger.error('Error running webhook');
        this.logger.error(error);
      });
    }
  }

  run(webhook, event, info = {}) {
    const { url, headers } = webhook;
    const sanitizedInfo = _.pick(info, ['model', 'entry', 'media']);

    return fetch(url, {
      method: 'post',
      body: JSON.stringify({
        event,
        created_at: new Date(),
        ...sanitizedInfo,
      }),
      headers: {
        ...this.config.defaultHeaders,
        ...headers,
        'X-Strapi-Event': event,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    })
      .then(async res => {
        if (res.ok) {
          return {
            statusCode: res.status,
          };
        }

        return {
          statusCode: res.status,
          message: await res.text(),
        };
      })
      .catch(err => {
        return {
          statusCode: 500,
          message: err.message,
        };
      });
  }

  add(webhook) {
    debug(`Registering webhook '${webhook.id}'`);
    const { events } = webhook;

    events.forEach(event => {
      if (this.webhooksMap.has(event)) {
        this.webhooksMap.get(event).push(webhook);
      } else {
        this.webhooksMap.set(event, [webhook]);
        this.createListener(event);
      }
    });
  }

  update(webhook) {
    debug(`Refreshing webhook '${webhook.id}'`);
    this.remove(webhook);
    this.add(webhook);
  }

  remove(webhook) {
    debug(`Unregistering webhook '${webhook.id}'`);

    this.webhooksMap.forEach((webhooks, event) => {
      const filteredWebhooks = webhooks.filter(value => value.id !== webhook.id);

      // Cleanup hanging listeners
      if (filteredWebhooks.length === 0) {
        this.webhooksMap.delete(event);
        this.deleteListener(event);
      } else {
        this.webhooksMap.set(event, filteredWebhooks);
      }
    });
  }
}

/**
 * Expose a factory function instead of the class
 */
module.exports = function createWebhookRunner(opts) {
  return new WebhookRunner(opts);
};
