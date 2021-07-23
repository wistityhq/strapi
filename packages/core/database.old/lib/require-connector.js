'use strict';

const VError = require('verror');

/**
 * Requires a database connector
 * @param {string} connector connector name
 * @param {DatabaseManager} databaseManager reference to the database manager
 */
module.exports = function requireConnector(connector) {
  if (!connector) {
    throw new VError({ name: 'ConnectorError' }, 'initialize connector without name');
  }

  try {
    require.resolve(`@strapi/connector-${connector}`);
  } catch (error) {
    throw new VError(
      { name: 'ConnectorError', cause: error },
      'connector "%s" not found',
      connector
    );
  }

  try {
    return require(`@strapi/connector-${connector}`);
  } catch (error) {
    throw new VError(
      { name: 'ConnectorError', cause: error },
      'initialize connector "%s"',
      connector
    );
  }
};
