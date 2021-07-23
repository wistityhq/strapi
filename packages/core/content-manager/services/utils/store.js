'use strict';

const _ = require('lodash');

const keys = {
  CONFIGURATION: 'configuration',
};

const getStore = () => {
  return strapi.store({
    environment: '',
    type: 'plugin',
    name: 'content_manager',
  });
};

/** Model configuration */
const EMPTY_CONFIG = {
  settings: {},
  metadatas: {},
  layouts: {},
};

const configurationKey = key => `${keys.CONFIGURATION}_${key}`;

const getModelConfiguration = async key => {
  const config = await getStore().get({ key: configurationKey(key) });
  return _.merge({}, EMPTY_CONFIG, config);
};

const setModelConfiguration = async (key, value) => {
  const storedConfig = (await getStore().get({ key: configurationKey(key) })) || {};
  const currentConfig = { ...storedConfig };
  Object.keys(value).forEach(key => {
    if (value[key] !== null && value[key] !== undefined) {
      _.set(currentConfig, key, value[key]);
    }
  });

  if (!_.isEqual(currentConfig, storedConfig)) {
    return getStore().set({
      key: configurationKey(key),
      value: currentConfig,
    });
  }
};

const deleteKey = key => {
  return strapi
    .query('strapi::core-store')
    .delete({ where: { key: `plugin_content_manager_configuration_${key}` } });
};

const findByKey = async key => {
  const results = await strapi.query('strapi::core-store').findMany({
    where: {
      key: {
        $startsWith: key,
      },
    },
  });

  return results.map(({ value }) => JSON.parse(value));
};

const getAllConfigurations = () => findByKey('plugin_content_manager_configuration');

module.exports = {
  getAllConfigurations,
  findByKey,
  getModelConfiguration,
  setModelConfiguration,

  deleteKey,
  keys,
};
