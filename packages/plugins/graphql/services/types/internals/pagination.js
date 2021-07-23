'use strict';

const { objectType } = require('nexus');

const { PAGINATION_TYPE_NAME } = require('../constants');

// todo[v4]: Use custom resolvers to handle pagination
/**
 * Type definition for a Pagination object
 * @type {NexusObjectTypeDef}
 */
const Pagination = objectType({
  name: PAGINATION_TYPE_NAME,

  definition(t) {
    t.nonNull.field('total', {
      type: 'Int',

      resolve(/*root, args*/) {
        // const { uid } = root;

        // return strapi.query(uid).count(args);
        return 0;
      },
    });

    t.nonNull.field('page', {
      type: 'Int',

      resolve() {
        return 0;
      },
    });

    t.nonNull.field('pageSize', {
      type: 'Int',

      resolve() {
        return 0;
      },
    });

    t.nonNull.field('pageCount', {
      type: 'Int',

      resolve() {
        return 0;
      },
    });
  },
});

module.exports = Pagination;
