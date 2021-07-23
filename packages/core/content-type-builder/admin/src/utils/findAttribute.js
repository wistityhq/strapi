const findAttribute = (attributes, attributeToFind) => {
  return attributes.find(({ name }) => name === attributeToFind);
};

export default findAttribute;
