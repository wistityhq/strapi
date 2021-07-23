'use strict';

const checkDuplicatedTableNames = require('./check-duplicated-table-names');
const checkReservedNames = require('./check-reserved-names');

const validateModelSchemas = ({ strapi, manager }) => {
  checkDuplicatedTableNames({ strapi, manager });
  checkReservedNames({ strapi, manager });
};

module.exports = {
  validateModelSchemas,
};
