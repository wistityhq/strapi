'use strict';

// Dependencies.
const { isEmpty, isNil } = require('lodash');
const openBrowser = require('./openBrowser');

module.exports = {
  /*
   * Return false where there is no administrator, otherwise return true.
   */
  async isInitialised(strapi) {
    try {
      if (isEmpty(strapi.admin)) {
        return true;
      }

      // test if there is at least one admin
      const anyAdministrator = await strapi.query('strapi::user').findOne({ select: ['id'] });

      return !isNil(anyAdministrator);
    } catch (err) {
      strapi.stopWithError(err);
    }
  },
  openBrowser,
};
