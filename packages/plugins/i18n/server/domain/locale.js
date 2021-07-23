'use strict';

const formatLocale = locale => {
  return {
    ...locale,
    name: locale.name || null,
  };
};

module.exports = { formatLocale };
