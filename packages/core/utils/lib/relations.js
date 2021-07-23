'use strict';

const MANY_RELATIONS = ['oneToMany', 'manyToMany', 'manyWay'];

const getRelationalFields = contentType => {
  return Object.keys(contentType.attributes).filter(attributeName => {
    return contentType.attributes[attributeName].type === 'relation';
  });
};

module.exports = {
  getRelationalFields,
  constants: {
    MANY_RELATIONS,
  },
};
