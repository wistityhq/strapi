'use strict';

const { getService } = require('../utils');

module.exports = {
  getReservedNames(ctx) {
    ctx.body = getService('builder').getReservedNames();
  },
};
