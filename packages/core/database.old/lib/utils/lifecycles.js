'use strict';

const _ = require('lodash');

const executeLifecycle = async (lifecycle, model, ...args) => {
  // Run registered lifecycles
  await strapi.db.lifecycles.run(lifecycle, model, ...args);

  // Run user lifecycles
  if (_.has(model, `lifecycles.${lifecycle}`)) {
    await model.lifecycles[lifecycle](...args);
  }
};

const executeBeforeLifecycle = (lifecycle, model, ...args) =>
  executeLifecycle(`before${_.upperFirst(lifecycle)}`, model, ...args);

const executeAfterLifecycle = (lifecycle, model, ...args) =>
  executeLifecycle(`after${_.upperFirst(lifecycle)}`, model, ...args);

module.exports = {
  executeBeforeLifecycle,
  executeAfterLifecycle,
};
