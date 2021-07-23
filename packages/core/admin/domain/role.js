'use strict';

const {
  contentTypes: { hasDraftAndPublish },
} = require('@strapi/utils');
const {
  AUTHOR_CODE,
  PUBLISH_ACTION,
  DELETE_ACTION,
  UPDATE_ACTION,
  CREATE_ACTION,
  READ_ACTION,
} = require('../services/constants');

const BOUND_ACTIONS = [READ_ACTION, CREATE_ACTION, UPDATE_ACTION, DELETE_ACTION, PUBLISH_ACTION];

const BOUND_ACTIONS_FOR_FIELDS = [READ_ACTION, CREATE_ACTION, UPDATE_ACTION];

const getBoundActionsBySubject = (role, subject) => {
  const model = strapi.contentTypes[subject];

  if (role.code === AUTHOR_CODE || !hasDraftAndPublish(model)) {
    return [READ_ACTION, UPDATE_ACTION, CREATE_ACTION, DELETE_ACTION];
  }

  return BOUND_ACTIONS;
};

module.exports = { getBoundActionsBySubject, BOUND_ACTIONS, BOUND_ACTIONS_FOR_FIELDS };
