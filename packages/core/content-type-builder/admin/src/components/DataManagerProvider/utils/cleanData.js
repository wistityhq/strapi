import { get, isEqual, omit, sortBy, camelCase } from 'lodash';

import pluginId from '../../../pluginId';
import makeUnique from '../../../utils/makeUnique';

const getCreatedAndModifiedComponents = (allComponents, initialComponents) => {
  const componentUIDsToReturn = Object.keys(allComponents).filter(compoUid => {
    const currentCompo = get(allComponents, compoUid, {});
    const initialCompo = get(initialComponents, compoUid, {});
    const hasComponentBeenCreated = get(currentCompo, ['isTemporary'], false);
    const hasComponentBeenModified = !isEqual(currentCompo, initialCompo);

    return hasComponentBeenCreated || hasComponentBeenModified;
  });

  return makeUnique(componentUIDsToReturn);
};

const formatComponent = (component, mainDataUID, isCreatingData = false) => {
  const formattedAttributes = formatAttributes(
    get(component, 'schema.attributes', []),
    mainDataUID,
    isCreatingData,
    true
  );

  // Set tmpUID if the component has just been created
  // Keep the uid if the component already exists
  const compoUID = get(component, 'isTemporary', false)
    ? { tmpUID: component.uid }
    : { uid: component.uid };

  const formattedComponent = Object.assign(
    {},
    compoUID,
    { category: component.category },
    // Omit the attributes since we want to format them
    omit(component.schema, 'attributes'),
    // Add the formatted attributes
    { attributes: formattedAttributes }
  );

  return formattedComponent;
};

const formatMainDataType = (data, isComponent = false) => {
  const isCreatingData = get(data, 'isTemporary', false);
  const mainDataUID = get(data, 'uid', null);

  const formattedAttributes = formatAttributes(
    get(data, 'schema.attributes', []),
    mainDataUID,
    isCreatingData,
    false
  );
  const initObj = isComponent ? { category: get(data, 'category', '') } : {};

  const formattedContentType = Object.assign(initObj, omit(data.schema, 'attributes'), {
    attributes: formattedAttributes,
  });

  delete formattedContentType.uid;
  delete formattedContentType.isTemporary;
  delete formattedContentType.visible;
  delete formattedContentType.restrictRelationsTo;

  return formattedContentType;
};

/**
 *
 * @param {Object} attributes
 * @param {String} mainDataUID uid of the main data type
 * @param {Boolean} isCreatingMainData
 * @param {Boolean} isComponent
 */
const formatAttributes = (attributes, mainDataUID, isCreatingMainData, isComponent) => {
  return attributes.reduce((acc, { name, ...rest }) => {
    const currentAttribute = rest;
    const hasARelationWithMainDataUID = currentAttribute.target === mainDataUID;
    const isRelationType = currentAttribute.type === 'relation';
    const currentTargetAttribute = get(currentAttribute, 'targetAttribute', null);

    if (!hasARelationWithMainDataUID) {
      if (isRelationType) {
        const relationAttr = Object.assign({}, currentAttribute, {
          targetAttribute: formatRelationTargetAttribute(currentTargetAttribute),
        });

        acc[name] = removeNullKeys(relationAttr);
      } else {
        acc[name] = removeNullKeys(currentAttribute);
      }
    }

    // TODO check with @alexandrebodin if needed
    // Not sure this is needed
    if (hasARelationWithMainDataUID) {
      let target = currentAttribute.target;

      if (isCreatingMainData) {
        target = isComponent ? '__contentType__' : '__self__';
      }

      const formattedRelationAttribute = Object.assign({}, currentAttribute, {
        target,
        targetAttribute: formatRelationTargetAttribute(currentTargetAttribute),
      });

      acc[name] = removeNullKeys(formattedRelationAttribute);
    }

    return acc;
  }, {});
};

const formatRelationTargetAttribute = targetAttribute =>
  targetAttribute === '-' ? null : targetAttribute;

const removeNullKeys = obj =>
  Object.keys(obj).reduce((acc, current) => {
    if (obj[current] !== null && current !== 'plugin') {
      acc[current] = obj[current];
    }

    return acc;
  }, {});

const getComponentsToPost = (
  allComponents,
  initialComponents,
  mainDataUID,
  isCreatingData = false
) => {
  const componentsToFormat = getCreatedAndModifiedComponents(allComponents, initialComponents);
  const formattedComponents = componentsToFormat.map(compoUID => {
    const currentCompo = get(allComponents, compoUID, {});
    const formattedComponent = formatComponent(currentCompo, mainDataUID, isCreatingData);

    return formattedComponent;
  });

  return formattedComponents;
};

const sortContentType = types =>
  sortBy(
    Object.keys(types)
      .map(uid => ({
        visible: types[uid].schema.visible,
        name: uid,
        title: types[uid].schema.name,
        plugin: types[uid].plugin || null,
        uid,
        to: `/plugins/${pluginId}/content-types/${uid}`,
        kind: types[uid].schema.kind,
        restrictRelationsTo: types[uid].schema.restrictRelationsTo,
      }))
      .filter(obj => obj !== null),
    obj => camelCase(obj.title)
  );

export {
  formatComponent,
  getComponentsToPost,
  getCreatedAndModifiedComponents,
  formatMainDataType,
  sortContentType,
};
