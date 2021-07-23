'use strict';

const { objectType } = require('nexus');

const { utils } = require('../../types');

/**
 * Build a higher level type for a content type which contains both the attributes, the ID and the metadata
 * @param {object} contentType The content type which will be used to build its entity type
 * @return {NexusObjectTypeDef}
 */
const buildEntityDefinition = contentType => {
  const name = utils.getEntityName(contentType);
  const typeName = utils.getTypeName(contentType);

  return objectType({
    name,

    definition(t) {
      t.id('id');
      t.field('attributes', { type: typeName });
      // todo[v4]: add the meta field to the entity when there will be data in it
      // t.field('meta', { type: utils.getEntityMetaName(contentType) });
    },
  });
};

module.exports = () => ({
  buildEntityDefinition,
});
