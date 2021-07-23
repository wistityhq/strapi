'use strict';

const { objectType, nonNull } = require('nexus');

const { utils, constants } = require('../../types');

const buildResponseCollectionDefinition = contentType => {
  const name = utils.getEntityResponseCollectionName(contentType);
  const entityName = utils.getEntityName(contentType);

  return objectType({
    name,

    definition(t) {
      t.nonNull.list.field('data', { type: nonNull(entityName) });
      t.nonNull.field('meta', { type: constants.RESPONSE_COLLECTION_META_TYPE_NAME });
    },
  });
};

module.exports = () => ({
  buildResponseCollectionDefinition,
});
