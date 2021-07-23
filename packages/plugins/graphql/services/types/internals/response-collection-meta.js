'use strict';

const { objectType } = require('nexus');

const { RESPONSE_COLLECTION_META_TYPE_NAME, PAGINATION_TYPE_NAME } = require('../constants');

/**
 * A shared type definition used in EntitiesResponseCollection
 * to have information about the collection as a whole
 * @type {NexusObjectTypeDef}
 */
const ResponseCollectionMeta = objectType({
  name: RESPONSE_COLLECTION_META_TYPE_NAME,

  definition(t) {
    t.nonNull.field('pagination', { type: PAGINATION_TYPE_NAME });
  },
});

module.exports = ResponseCollectionMeta;
