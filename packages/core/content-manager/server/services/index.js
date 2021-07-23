'use strict';

const components = require('../../services/components');
const contentTypes = require('../../services/content-types');
const dataMapper = require('../../services/data-mapper');
const metrics = require('../../services/metrics');
const permissionChecker = require('../../services/permission-checker');
const permission = require('../../services/permission');
const uid = require('../../services/uid');
const entityManager = require('../../services/entity-manager');

module.exports = {
  components,
  'content-types': contentTypes,
  'data-mapper': dataMapper,
  metrics,
  'permission-checker': permissionChecker,
  permission,
  uid,
  'entity-manager': entityManager,
};
