'use strict';

module.exports = async ({ connection }) => {
  const Mongoose = require('mongoose');

  const { username, password, srv } = connection.settings;
  const { authenticationDatabase, ssl } = connection.options;

  const connectOptions = {};

  if (username) {
    connectOptions.user = username;

    if (password) {
      connectOptions.pass = password;
    }
  }

  if (authenticationDatabase) {
    connectOptions.authSource = authenticationDatabase;
  } else {
    connectOptions.authSource = connection.settings.database;
  }

  connectOptions.ssl = ssl ? true : false;
  connectOptions.useNewUrlParser = true;
  connectOptions.dbName = connection.settings.database;

  return Mongoose.connect(
    `mongodb${srv ? '+srv' : ''}://${connection.settings.host}${
      !srv ? `:${connection.settings.port}` : ''
    }/`,
    connectOptions
  ).then(
    () => {
      Mongoose.connection.close();
    },
    error => {
      Mongoose.connection.close();
      throw error;
    }
  );
};
