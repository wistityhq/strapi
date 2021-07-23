'use strict';

const { has, isNil, mapValues } = require('lodash/fp');

const { getService } = require('../utils');
const storeUtils = require('./utils/store');
const createConfigurationService = require('./configuration');

const STORE_KEY_PREFIX = 'components';

const configurationService = createConfigurationService({
  storeUtils,
  isComponent: true,
  prefix: STORE_KEY_PREFIX,
  getModels() {
    const { toContentManagerModel } = getService('data-mapper');

    return mapValues(toContentManagerModel, strapi.components);
  },
});

module.exports = ({ strapi }) => ({
  findAllComponents() {
    const { toContentManagerModel } = getService('data-mapper');

    return Object.values(strapi.components).map(toContentManagerModel);
  },

  findComponent(uid) {
    const { toContentManagerModel } = getService('data-mapper');

    const component = strapi.components[uid];

    return isNil(component) ? component : toContentManagerModel(component);
  },

  // configuration

  async findConfiguration(component) {
    const configuration = await configurationService.getConfiguration(component.uid);

    return {
      uid: component.uid,
      category: component.categoru,
      ...configuration,
    };
  },

  async updateConfiguration(component, newConfiguration) {
    await configurationService.setConfiguration(component.uid, newConfiguration);

    return this.findConfiguration(component);
  },

  async findComponentsConfigurations(model) {
    const componentsMap = {};

    const getComponentConfigurations = async uid => {
      const component = this.findComponent(uid);

      if (has(uid, componentsMap)) return;

      const componentConfiguration = await this.findConfiguration(component);
      const componentsConfigurations = await this.findComponentsConfigurations(component);

      Object.assign(componentsMap, {
        [uid]: componentConfiguration,
        ...componentsConfigurations,
      });
    };

    for (const key in model.attributes) {
      const attribute = model.attributes[key];

      if (attribute.type === 'component') {
        await getComponentConfigurations(attribute.component);
      }

      if (attribute.type === 'dynamiczone') {
        for (const componentUid of attribute.components) {
          await getComponentConfigurations(componentUid);
        }
      }
    }

    return componentsMap;
  },

  syncConfigurations() {
    return configurationService.syncConfigurations();
  },
});
