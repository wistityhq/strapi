'use strict';

/**
 * Default db infos
 */
module.exports = {
  sqlite: {
    connection: {
      filename: '.tmp/data.db',
    },
    useNullAsDefault: true,
  },
  postgres: {},
  mysql: {},
};
