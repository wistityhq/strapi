'use strict';

const { isNil, mapValues } = require('lodash/fp');
const { contentTypes: contentTypesUtils } = require('@strapi/utils');

const { getService } = require('../utils');
const storeUtils = require('./utils/store');
const createConfigurationService = require('./configuration');

const configurationService = createConfigurationService({
  storeUtils,
  prefix: 'content_types',
  getModels() {
    const { toContentManagerModel } = getService('data-mapper');

    return mapValues(toContentManagerModel, strapi.contentTypes);
  },
});

const service = ({ strapi }) => ({
  findAllContentTypes() {
    const { toContentManagerModel } = getService('data-mapper');

    return Object.values(strapi.contentTypes).map(toContentManagerModel);
  },

  findContentType(uid) {
    const { toContentManagerModel } = getService('data-mapper');

    const contentType = strapi.contentTypes[uid];

    return isNil(contentType) ? contentType : toContentManagerModel(contentType);
  },

  findDisplayedContentTypes() {
    return this.findAllContentTypes().filter(({ isDisplayed }) => isDisplayed === true);
  },

  findContentTypesByKind(kind) {
    if (!kind) {
      return this.findAllContentTypes();
    }

    return this.findAllContentTypes().filter(contentTypesUtils.isKind(kind));
  },

  // configuration

  async findConfiguration(contentType) {
    const configuration = await configurationService.getConfiguration(contentType.uid);

    return {
      uid: contentType.uid,
      ...configuration,
    };
  },

  async updateConfiguration(contentType, newConfiguration) {
    await configurationService.setConfiguration(contentType.uid, newConfiguration);
    return this.findConfiguration(contentType);
  },

  findComponentsConfigurations(contentType) {
    // delegate to componentService
    return getService('components').findComponentsConfigurations(contentType);
  },

  syncConfigurations() {
    return configurationService.syncConfigurations();
  },
});

module.exports = service;
