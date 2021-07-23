'use strict';

const { has, mapValues } = require('lodash/fp');

module.exports = (servicesDefinitions, { strapi }) => {
  const instanciatedServices = new Map();

  return {
    has(serviceName) {
      return has(servicesDefinitions, serviceName);
    },
    get(serviceName) {
      if (instanciatedServices.has(serviceName)) {
        return instanciatedServices.get(serviceName);
      }

      const service = servicesDefinitions[serviceName];
      if (service) {
        instanciatedServices.set(serviceName, service({ strapi }));
        return instanciatedServices.get(serviceName);
      }

      return undefined;
    },
    getAll() {
      return mapValues((service, serviceName) => this.get(serviceName), servicesDefinitions);
    },
    get size() {
      return this.keys(servicesDefinitions).length;
    },
  };
};
