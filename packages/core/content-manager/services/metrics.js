'use strict';

const { intersection, prop } = require('lodash/fp');
const { getRelationalFields } = require('@strapi/utils').relations;

const sendDidConfigureListView = strapi => async (contentType, configuration) => {
  const displayedFields = prop('length', configuration.layouts.list);
  const relationalFields = getRelationalFields(contentType);
  const displayedRelationalFields = intersection(relationalFields, configuration.layouts.list)
    .length;

  const data = {
    containsRelationalFields: !!displayedRelationalFields,
  };

  if (data.containsRelationalFields) {
    Object.assign(data, {
      displayedFields,
      displayedRelationalFields,
    });
  }

  try {
    await strapi.telemetry.send('didConfigureListView', data);
  } catch (e) {
    // silence
  }
};

module.exports = ({ strapi }) => ({
  sendDidConfigureListView: sendDidConfigureListView(strapi),
});
