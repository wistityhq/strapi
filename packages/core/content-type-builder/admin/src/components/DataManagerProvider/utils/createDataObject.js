/**
 * Creates an object of content types from an array
 * @params {Object[]} arr array of content types
 * @returns {Object} an object of content types
 */
const createDataObject = arr =>
  arr.reduce((acc, current) => {
    acc[current.uid] = current;

    return acc;
  }, {});

export default createDataObject;
