'use strict';

const SCALAR_TYPES = [
  'increments',
  'password',
  'email',
  'string',
  'uid',
  'richtext',
  'text',
  'json',
  'enumeration',
  'integer',
  'biginteger',
  'float',
  'decimal',
  'date',
  'time',
  'datetime',
  'timestamp',
  'boolean',
];

module.exports = {
  isScalar: type => SCALAR_TYPES.includes(type),
  isComponent: type => type === 'component',
  isDynamicZone: type => type === 'dynamiczone',
  isRelation: type => type === 'relation',
};
