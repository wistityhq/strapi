'use strict';

const { isEmpty } = require('lodash/fp');

const { getService } = require('../../utils');

/**
 * Handler for the permissions layout (sections builder)
 * Adds the locales property to the subjects
 * @param {Action} action
 * @param {ContentTypesSection} section
 * @return {Promise<void>}
 */
const localesPropertyHandler = async ({ action, section }) => {
  const { actionProvider } = strapi.admin.services.permission;

  const locales = await getService('locales').find();

  // Do not add the locales property if there is none registered
  if (isEmpty(locales)) {
    return;
  }

  for (const subject of section.subjects) {
    const applies = await actionProvider.appliesToProperty('locales', action.actionId, subject.uid);
    const hasLocalesProperty = subject.properties.find(property => property.value === 'locales');

    if (applies && !hasLocalesProperty) {
      subject.properties.push({
        label: 'Locales',
        value: 'locales',
        children: locales.map(({ name, code }) => ({ label: name || code, value: code })),
      });
    }
  }
};

const registerLocalesPropertyHandler = () => {
  const { sectionsBuilder } = strapi.admin.services.permission;

  sectionsBuilder.addHandler('singleTypes', localesPropertyHandler);
  sectionsBuilder.addHandler('collectionTypes', localesPropertyHandler);
};

module.exports = {
  localesPropertyHandler,
  registerLocalesPropertyHandler,
};
