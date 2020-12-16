/* eslint-disable */
import itly from '@itly/sdk';
import SchemaValidatorPlugin from '@itly/plugin-schema-validator';
import IterativelyPlugin from '@itly/plugin-iteratively';

class WillCreateEntry {
  constructor(properties) {
    this.name = 'willCreateEntry';
    this.id = '506f5d1d-6e76-43e3-8ffc-4cd6cfcd1572';
    this.version = '2.0.0';
    this.properties = properties;
  }
}

class DidCreateEntry {
  constructor(properties) {
    this.name = 'didCreateEntry';
    this.id = '713325c2-0c4e-4d38-b82f-63e06ded179b';
    this.version = '1.0.0';
    this.properties = properties;
  }
}

class WillEditEntry {
  constructor(properties) {
    this.name = 'willEditEntry';
    this.id = '83f949a9-d1df-4a3b-a1ae-34edfbbf8fc3';
    this.version = '2.0.0';
    this.properties = properties;
  }
}

class DidInitializeAdministration {
  constructor() {
    this.name = 'didInitializeAdministration';
    this.id = '95070aa7-7b88-4987-b5df-47a9a6927a1f';
    this.version = '1.0.0';
  }
}

class DidEditEntry {
  constructor(properties) {
    this.name = 'didEditEntry';
    this.id = 'a9187f23-0243-4cce-b717-5a145c7a5077';
    this.version = '1.0.0';
    this.properties = properties;
  }
}

// prettier-ignore
class Itly {
  /*
   * Initialize the Itly SDK. Call once when your application starts.
   * @param {Object} options Configuration options to initialize the Itly SDK with.
   * @param {Object} options.context Set of properties to add to every event.
   * @param {boolean} [options.disabled=false] Flag to completely disable the Itly SDK.
   * @param {string} [options.environment=development] The environment the Itly SDK is running in (development or production).
   * @param {Object} [options.plugins] Collection of Plugin's.
   * @param {Object} [options.destinations] Analytics provider-specific configuration.
   */
  load(options) {
    if (!options.context) {
      throw new Error('Your tracking plan contains at least one context property but a `context` object was not provided on `options`.');
    }

    const {
      destinations = {},
      plugins = [],
      ...baseOptions
    } = options;

    if (!options.plugins || !options.plugins.length > 0) {
      throw new Error('Your tracking plan is configured with a custom destination but a `plugins` array was not provided on `options`.');
    }


    const destinationPlugins = destinations.all && destinations.all.disabled
      ? []
      : [
        new IterativelyPlugin(options.environment === 'production'
          ? 'UmeiW9Yw4SvS2F2n-olVcMStxeJykOeC'
          : 'flNLcUbi9EBp3683HnvZ0_ZqWx5yMXOw',
          {
            url: 'https://api.iterative.ly/t/version/67e5d3bc-bca3-4a8e-aaaf-3fac6d5bf175',
            environment: options.environment || 'development',
            ...destinations.iteratively,
          },
        ),
      ];

    itly.load({
      ...baseOptions,
      plugins: [
        new SchemaValidatorPlugin({
          'context': {"$id":"https://iterative.ly/company/46f8e8fa-e6ce-4826-87cd-611bc6e0be53/context","$schema":"http://json-schema.org/draft-07/schema#","title":"Context","description":"","type":"object","properties":{"projectType":{"description":"","enum":["Enterprise","Community"]}},"additionalProperties":false,"required":["projectType"]},
          'group': {"$id":"https://iterative.ly/company/46f8e8fa-e6ce-4826-87cd-611bc6e0be53/group","$schema":"http://json-schema.org/draft-07/schema#","title":"Group","description":"","type":"object","properties":{"tier":{"description":"The current plan of the account.","enum":["free","trial","premium"]},"plan":{"description":"The payment terms of the account.","enum":["monthly","annual"]},"createdAt":{"description":"The user's creation date (ISO-8601 date string).","type":"string"},"name":{"description":"The name of the account.","type":"string"}},"additionalProperties":false,"required":["tier","plan","createdAt","name"]},
          'identify': {"$id":"https://iterative.ly/company/46f8e8fa-e6ce-4826-87cd-611bc6e0be53/identify","$schema":"http://json-schema.org/draft-07/schema#","title":"Identify","description":"","type":"object","properties":{"createdAt":{"description":"The user's creation date (ISO-8601 date string).","type":"string"}},"additionalProperties":false,"required":["createdAt"]},
          'didCreateEntry': {"$id":"https://iterative.ly/company/46f8e8fa-e6ce-4826-87cd-611bc6e0be53/event/didCreateEntry/version/1.0.0","$schema":"http://json-schema.org/draft-07/schema#","title":"didCreateEntry","description":"When the entry has been created with success","type":"object","properties":{"status":{"description":"status draft when entry is a draft (no property if the D&P is not activated on the content type)","enum":["draft"]}},"additionalProperties":false,"required":[]},
          'didEditEntry': {"$id":"https://iterative.ly/company/46f8e8fa-e6ce-4826-87cd-611bc6e0be53/event/didEditEntry/version/1.0.0","$schema":"http://json-schema.org/draft-07/schema#","title":"didEditEntry","description":"When the entry has been edited with success","type":"object","properties":{"status":{"description":"status draft when entry is a draft (no property if the D&P is not activated on the content type)","enum":["draft"]}},"additionalProperties":false,"required":[]},
          'didInitializeAdministration': {"$id":"https://iterative.ly/company/46f8e8fa-e6ce-4826-87cd-611bc6e0be53/event/didInitializeAdministration/version/1.0.0","$schema":"http://json-schema.org/draft-07/schema#","title":"didInitializeAdministration","description":"","type":"object","properties":{},"additionalProperties":false,"required":[]},
          'willCreateEntry': {"$id":"https://iterative.ly/company/46f8e8fa-e6ce-4826-87cd-611bc6e0be53/event/willCreateEntry/version/2.0.0","$schema":"http://json-schema.org/draft-07/schema#","title":"willCreateEntry","description":"When a user starts to create a new entry after clicking on the \"Add New X\" button","type":"object","properties":{"status":{"description":"status draft when entry is a draft (no property if the D&P is not activated on the content type)","enum":["draft"]}},"additionalProperties":false,"required":[]},
          'willEditEntry': {"$id":"https://iterative.ly/company/46f8e8fa-e6ce-4826-87cd-611bc6e0be53/event/willEditEntry/version/2.0.0","$schema":"http://json-schema.org/draft-07/schema#","title":"willEditEntry","description":"When a user clicks on the Save button while editing an existing entry","type":"object","properties":{"status":{"description":"status draft when entry is a draft (no property if the D&P is not activated on the content type)","enum":["draft"]}},"additionalProperties":false,"required":[]},
        }),
        ...destinationPlugins,
        ...plugins,
      ]
    });
  }

  /**
   * Alias a user ID to another user ID.
   * @param {string} userId The user's new ID.
   * @param {string} previousId The user's previous ID.
   */
  alias(userId, previousId) {
    itly.alias(userId, previousId);
  }

  /**
   * Identify a user and set or update that user's properties.
   * @param {string} [userId] The user's ID.
   * @param {Object} properties The user's properties.
   * @param {string} properties.createdAt The user's creation date (ISO-8601 date string).
   */
  identify(userId, properties) {
    if (Object.prototype.toString.call(userId) === '[object Object]') {
      properties = userId;
      userId = undefined;
    }

    if (!properties) {
      throw new Error('Your tracking plan contains at least one user property but `properties` were not passed as an argument.');
    }
    itly.identify(userId, properties);
  }

  /**
   * Associate the current user with a group and set or update that group's properties.
   * @param {string} groupId The group's ID.
   * @param {Object} properties The group's properties.
   * @param {string} properties.tier The current plan of the account.
   * @param {string} properties.plan The payment terms of the account.
   * @param {string} properties.createdAt The user's creation date (ISO-8601 date string).
   * @param {string} properties.name The name of the account.
   */
  group(groupId, properties) {
    if (!properties) {
      throw new Error('Your tracking plan contains at least one group property but `properties` were not passed as an argument.');
    }
    itly.group(groupId, properties);
  }

  /**
   * Track a page view.
   * @param {string} category The page's category.
   * @param {string} name The page's name.
   */
  page(category, name) {
    itly.page(category, name);
  }

  /**
   * When a user starts to create a new entry after clicking on the "Add New X" button
   * 
   * Owner: Iteratively Support
   * @param {Object} properties The event's properties.
   * @param {string} properties.status status draft when entry is a draft (no property if the D&P is not activated on the content type)
   */
  willCreateEntry(properties) {
    if (!properties) {
      throw new Error('There is at least one property defined on this event in your tracking plan but `properties` were not passed as an argument.');
    }

    itly.track(new WillCreateEntry(properties));
  }

  /**
   * When the entry has been created with success
   * 
   * Owner: Iteratively Support
   * @param {Object} properties The event's properties.
   * @param {string} properties.status status draft when entry is a draft (no property if the D&P is not activated on the content type)
   */
  didCreateEntry(properties) {
    if (!properties) {
      throw new Error('There is at least one property defined on this event in your tracking plan but `properties` were not passed as an argument.');
    }

    itly.track(new DidCreateEntry(properties));
  }

  /**
   * When a user clicks on the Save button while editing an existing entry
   * 
   * Owner: Iteratively Support
   * @param {Object} properties The event's properties.
   * @param {string} properties.status status draft when entry is a draft (no property if the D&P is not activated on the content type)
   */
  willEditEntry(properties) {
    if (!properties) {
      throw new Error('There is at least one property defined on this event in your tracking plan but `properties` were not passed as an argument.');
    }

    itly.track(new WillEditEntry(properties));
  }

  /**
   * Owner: Iteratively Support
   */
  didInitializeAdministration() {
    itly.track(new DidInitializeAdministration());
  }

  /**
   * When the entry has been edited with success
   * 
   * Owner: Iteratively Support
   * @param {Object} properties The event's properties.
   * @param {string} properties.status status draft when entry is a draft (no property if the D&P is not activated on the content type)
   */
  didEditEntry(properties) {
    if (!properties) {
      throw new Error('There is at least one property defined on this event in your tracking plan but `properties` were not passed as an argument.');
    }

    itly.track(new DidEditEntry(properties));
  }

  track(event) {
    itly.track(event);
  }

  reset() {
    itly.reset();
  }
}

const itlySdk = new Itly();

export default itlySdk;
export {
  DidCreateEntry,
  DidEditEntry,
  DidInitializeAdministration,
  WillCreateEntry,
  WillEditEntry,
};
