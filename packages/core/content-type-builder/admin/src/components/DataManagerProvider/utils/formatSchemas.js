/**
 * Format the attributes to array instead of an object
 * @params {Object} schemas The content types schema
 * @returns {Object} The formatted content types
 */
const formatSchemas = schemas => {
  return Object.keys(schemas).reduce((acc, current) => {
    const schema = schemas[current].schema;

    acc[current] = {
      ...schemas[current],
      schema: { ...schema, attributes: toAttributesArray(schema.attributes) },
    };

    return acc;
  }, {});
};

/**
 *
 * @params {Object} Object of attributes
 * @returns {Object[]} An array of attributes
 */
const toAttributesArray = attributes => {
  return Object.keys(attributes).reduce((acc, current) => {
    acc.push({ ...attributes[current], name: current });

    return acc;
  }, []);
};

export default formatSchemas;
export { toAttributesArray };
