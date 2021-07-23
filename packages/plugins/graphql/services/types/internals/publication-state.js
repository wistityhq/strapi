'use strict';

const { enumType } = require('nexus');

const { PUBLICATION_STATE_TYPE_NAME } = require('../constants');

/**
 * An enum type definition representing a publication state
 * @type {NexusEnumTypeDef}
 */
const PublicationState = enumType({
  name: PUBLICATION_STATE_TYPE_NAME,

  members: {
    // Published only
    LIVE: 'live',
    // Published & draft
    PREVIEW: 'preview',
  },
});

module.exports = { PublicationState };
