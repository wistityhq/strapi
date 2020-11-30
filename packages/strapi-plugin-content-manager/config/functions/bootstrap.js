'use strict';

const { getService } = require('../../utils');

module.exports = async () => {
  await getService('components').syncConfigurations();
  await getService('content-types').syncConfigurations();
  await getService('permission').registerPermissions();
  await getService('editing-lock').registerLockHook();
};
