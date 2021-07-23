'use strict';

const associationResolvers = require('./association');
const queryResolvers = require('./query');
const mutationResolvers = require('./mutation');

module.exports = {
  ...associationResolvers,
  ...queryResolvers,
  ...mutationResolvers,
};
