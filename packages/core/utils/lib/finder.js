'use strict';

/**
 * Module dependencies
 */

const _ = require('lodash');

/**
 * Find controller's location
 */

module.exports = (api, controller) => {
  if (!_.isObject(api)) {
    throw new Error('Should be an object');
  }
  if (_.isString(controller)) {
    controller = controller.toLowerCase();
  } else {
    throw new Error('Should be an object or a string');
  }

  const where = _.findKey(api, o => {
    return _.get(o, `controllers.${controller}`);
  });

  // Return the API's name where the controller is located
  return where;
};
