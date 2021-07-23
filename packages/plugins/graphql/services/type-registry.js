'use strict';

const { isFunction } = require('lodash/fp');

/**
 * @typedef RegisteredTypeDef
 *
 * @property {string} name
 * @property {NexusAcceptedTypeDef} definition
 * @property {object} config
 */

/**
 * Create a new type registry
 */
const createTypeRegistry = () => {
  const registry = new Map();

  return {
    /**
     * Register a new type definition
     * @param {string} name The name of the type
     * @param {NexusAcceptedTypeDef} definition The Nexus definition for the type
     * @param {object} [config] An optional config object with any metadata inside
     */
    register(name, definition, config = {}) {
      if (registry.has(name)) {
        throw new Error(`"${name}" has already been registered`);
      }

      registry.set(name, { name, definition, config });

      return this;
    },

    /**
     * Register many types definitions at once
     * @param {[string, NexusAcceptedTypeDef][]} definitionsEntries
     * @param {object | function} [config]
     */
    registerMany(definitionsEntries, config = {}) {
      for (const [name, definition] of definitionsEntries) {
        this.register(name, definition, isFunction(config) ? config(name, definition) : config);
      }

      return this;
    },

    /**
     * Check if the given type name has already been added to the registry
     * @param {string} name
     * @return {boolean}
     */
    has(name) {
      return registry.has(name);
    },

    /**
     * Get the type definition for `name`
     * @param {string} name - The name of the type
     */
    get(name) {
      return registry.get(name);
    },

    /**
     * Transform and return the registry as an object
     * @return {Object<string, RegisteredTypeDef>}
     */
    toObject() {
      return Object.fromEntries(registry.entries());
    },

    /**
     * Return the name of every registered type
     * @return {string[]}
     */
    get types() {
      return Array.from(registry.keys());
    },

    /**
     * Return all the registered definitions as an array
     * @return {RegisteredTypeDef[]}
     */
    get definitions() {
      return Array.from(registry.values());
    },

    /**
     * Filter and return the types definitions that matches the given predicate
     * @param {function(RegisteredTypeDef): boolean} predicate
     * @return {RegisteredTypeDef[]}
     */
    where(predicate) {
      return this.definitions.filter(predicate);
    },
  };
};

module.exports = {
  create: createTypeRegistry,
};
