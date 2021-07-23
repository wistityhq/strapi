'use strict';

const { arg } = require('nexus');

const { PUBLICATION_STATE_TYPE_NAME } = require('../constants');

const PublicationStateArg = arg({
  type: PUBLICATION_STATE_TYPE_NAME,
  default: 'live',
});

module.exports = { PublicationStateArg };
