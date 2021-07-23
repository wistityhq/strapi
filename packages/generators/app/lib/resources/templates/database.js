'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');

module.exports = ({ connection, client }) => {
  const tmpl = fs.readFileSync(path.join(__dirname, 'database-templates', `${client}.template`));
  const compile = _.template(tmpl);

  return compile({
    client: connection.client,
    connection: {
      ...connection.connection,
      ssl: connection.connection.ssl || false,
    },
  });
};
