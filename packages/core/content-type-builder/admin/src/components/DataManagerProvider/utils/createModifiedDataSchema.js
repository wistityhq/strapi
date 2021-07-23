import get from 'lodash/get';

/**
 *
 * @params {Object} contentTypeSchema
 * @params {Object[]} retrievedComponents array of components that are used in the content type
 * @params {Object} allComponentsSchema All app's components
 * @params {Boolean} isInContentTypeView
 * @returns {Object} The modifiedData to set in the reducer
 */
const createModifiedDataSchema = (
  contentTypeSchema,
  retrievedComponents,
  allComponentsSchema,
  isInContentTypeView
) => {
  const componentsAssociatedToContentType = retrievedComponents.reduce((acc, current) => {
    const componentSchema = get(allComponentsSchema, current, {});

    acc[current] = componentSchema;

    return acc;
  }, {});
  const keyName = isInContentTypeView ? 'contentType' : 'component';
  const schema = {
    [keyName]: contentTypeSchema,
    components: componentsAssociatedToContentType,
  };

  return schema;
};

export default createModifiedDataSchema;
