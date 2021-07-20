'use strict';

/**
 * Lifecycle callbacks for the `Restaurant` model.
 */

module.exports = {
  lifecycles: {
    beforeCreate(...args) {
      // console.log('beforeCreate', ...args);
    },
    afterCreate(...args) {
      // console.log('afterCreate', ...args);
    },
    beforeUpdate(...args) {
      // console.log('beforeUpdate', ...args);
    },
    afterUpdate(...args) {
      // console.log('afterUpdate', ...args);
    },
    beforeDelete(...args) {
      // console.log('beforeDelete', ...args);
    },
    afterDelete(...args) {
      // console.log('afterDelete', ...args);
    },
    beforeFind(...args) {
      // console.log('beforeFind', ...args);
    },
    afterFind(...args) {
      // console.log('afterFind', ...args);
    },
    beforeFindOne(...args) {
      // console.log('beforeFindOne', ...args);
    },
    afterFindOne(...args) {
      // console.log('afterFindOne', ...args);
    },
    beforeCount(...args) {
      // console.log('beforeCount', ...args);
    },
    afterCount(...args) {
      // console.log('afterCount', ...args);
    },
    beforeSearch(...args) {
      // console.log('beforeSearch', ...args);
    },
    afterSearch(...args) {
      // console.log('afterSearch', ...args);
    },
    beforeCountSearch(...args) {
      // console.log('beforeCountSearch', ...args);
    },
    afterCountSearch(...args) {
      // console.log('afterCountSearch', ...args);
    },
  },
};
