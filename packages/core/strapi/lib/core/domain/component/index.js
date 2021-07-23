'use strict';

const { cloneDeep, camelCase } = require('lodash/fp');
const { validateComponentDefinition } = require('./validator');

const createComponent = (definition = {}) => {
  validateComponentDefinition(definition);

  const createdComponent = cloneDeep(definition);
  const category = camelCase(definition.info.category);

  const uid = `${category}.${definition.info.singularModelName}`;

  Object.assign(createdComponent, {
    uid,
    category,
  });

  return createdComponent;
};

module.exports = {
  createComponent,
};
