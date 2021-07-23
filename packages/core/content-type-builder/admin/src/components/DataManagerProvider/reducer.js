import produce, { current } from 'immer';
import get from 'lodash/get';
import set from 'lodash/set';
import makeUnique from '../../utils/makeUnique';
import getRelationType from '../../utils/getRelationType';
import retrieveComponentsFromSchema from './utils/retrieveComponentsFromSchema';
import * as actions from './constants';

const initialState = {
  components: {},
  contentTypes: {},
  initialComponents: {},
  initialContentTypes: {},
  initialData: {},
  modifiedData: {},
  reservedNames: {},
  isLoading: true,
  isLoadingForDataToBeSet: true,
};

const ONE_SIDE_RELATIONS = ['oneWay', 'manyWay'];

const getOppositeRelation = originalRelation => {
  if (originalRelation === 'manyToOne') {
    return 'oneToMany';
  }

  if (originalRelation === 'oneToMany') {
    return 'manyToOne';
  }

  return originalRelation;
};

const findAttributeIndex = (schema, attributeToFind) => {
  return schema.schema.attributes.findIndex(({ name }) => name === attributeToFind);
};

const reducer = (state = initialState, action) =>
  // eslint-disable-next-line consistent-return
  produce(state, draftState => {
    switch (action.type) {
      case actions.ADD_ATTRIBUTE: {
        const {
          attributeToSet: { name, ...rest },
          forTarget,
          targetUid,
        } = action;
        delete rest.createComponent;

        const pathToDataToEdit = ['component', 'contentType'].includes(forTarget)
          ? [forTarget]
          : [forTarget, targetUid];

        const currentAttributes = get(
          state,
          ['modifiedData', ...pathToDataToEdit, 'schema', 'attributes'],
          []
        ).slice();

        // Add the createdAttribute
        const updatedAttributes = [...currentAttributes, { ...rest, name }];

        set(
          draftState,
          ['modifiedData', ...pathToDataToEdit, 'schema', 'attributes'],
          updatedAttributes
        );

        if (action.shouldAddComponentToData) {
          const componentToAddUID = rest.component;
          const componentToAdd = state.components[componentToAddUID];
          const isTemporaryComponent = componentToAdd.isTemporary;
          const hasComponentAlreadyBeenAdded =
            state.modifiedData.components[componentToAddUID] !== undefined;

          if (isTemporaryComponent || hasComponentAlreadyBeenAdded) {
            break;
          }

          // Add the added component to the modifiedData.components
          draftState.modifiedData.components[componentToAddUID] = componentToAdd;

          const nestedComponents = retrieveComponentsFromSchema(
            componentToAdd.schema.attributes,
            state.components
          );

          // We dont' need to set the already added components otherwise all modifications will be lost so we need to only add the not modified ones
          const nestedComponentsToAddInModifiedData = nestedComponents.filter(compoUID => {
            return get(state, ['modifiedData', 'components', compoUID]) === undefined;
          });

          nestedComponentsToAddInModifiedData.forEach(compoUID => {
            const compoSchema = get(state, ['components', compoUID], {});
            const isTemporary = compoSchema.isTemporary || false;

            // If the nested component has not been saved we don't need to add them as they are already in the state
            if (!isTemporary) {
              draftState.modifiedData.components[compoUID] = compoSchema;
            }
          });

          break;
        }

        const isCreatingRelationAttribute = rest.type === 'relation';

        if (isCreatingRelationAttribute) {
          const target = rest.target;
          const targetAttribute = rest.targetAttribute || null;
          const relation = rest.relation;
          const relationType = getRelationType(relation, targetAttribute);
          const currentUid = get(state, ['modifiedData', ...pathToDataToEdit, 'uid']);

          // When the user in creating a relation with the same content type we need to create another attribute
          // that is the opposite of the created one
          if (
            rest.type === 'relation' &&
            relationType !== 'oneWay' &&
            relationType !== 'manyWay' &&
            target === currentUid
          ) {
            const oppositeAttribute = {
              name: targetAttribute,
              relation: getOppositeRelation(relationType),
              target,
              targetAttribute: name,
              type: 'relation',
            };

            if (rest.private) {
              oppositeAttribute.private = rest.private;
            }

            const attributesToSet = [...updatedAttributes, oppositeAttribute];

            set(
              draftState,
              ['modifiedData', ...pathToDataToEdit, 'schema', 'attributes'],
              attributesToSet
            );
          }
        }

        break;
      }
      case actions.ADD_CREATED_COMPONENT_TO_DYNAMIC_ZONE: {
        const { dynamicZoneTarget, componentsToAdd } = action;

        const dzAttributeIndex = findAttributeIndex(
          state.modifiedData.contentType,
          dynamicZoneTarget
        );

        componentsToAdd.forEach(componentUid => {
          draftState.modifiedData.contentType.schema.attributes[dzAttributeIndex].components.push(
            componentUid
          );
        });

        break;
      }
      case actions.CANCEL_CHANGES: {
        draftState.modifiedData = state.initialData;
        draftState.components = state.initialComponents;

        break;
      }
      case actions.CHANGE_DYNAMIC_ZONE_COMPONENTS: {
        const { dynamicZoneTarget, newComponents } = action;

        const dzAttributeIndex = findAttributeIndex(
          state.modifiedData.contentType,
          dynamicZoneTarget
        );

        const currentDZComponents =
          state.modifiedData.contentType.schema.attributes[dzAttributeIndex].components;

        const updatedComponents = makeUnique([...currentDZComponents, ...newComponents]);

        draftState.modifiedData.contentType.schema.attributes[
          dzAttributeIndex
        ].components = updatedComponents;

        // Retrieve all the components that needs to be added to the modifiedData.components
        const nestedComponents = retrieveComponentsFromSchema(
          current(draftState.modifiedData.contentType.schema.attributes),
          state.components
        );

        // We dont' need to set the already added components otherwise all modifications will be lost so we need to only add the not modified ones
        const nestedComponentsToAddInModifiedData = nestedComponents.filter(compoUID => {
          return get(state, ['modifiedData', 'components', compoUID]) === undefined;
        });

        nestedComponentsToAddInModifiedData.forEach(compoUID => {
          const compoSchema = get(state, ['components', compoUID], {});
          const isTemporary = compoSchema.isTemporary || false;

          // If the nested component has not been saved we don't need to add them as they are already in the state
          if (!isTemporary) {
            draftState.modifiedData.components[compoUID] = compoSchema;
          }
        });

        break;
      }
      case actions.CREATE_COMPONENT_SCHEMA: {
        const newSchema = {
          uid: action.uid,
          isTemporary: true,
          category: action.componentCategory,
          schema: {
            ...action.data,
            attributes: [],
          },
        };

        draftState.components[action.uid] = newSchema;

        if (action.shouldAddComponentToData) {
          draftState.modifiedData.components[action.uid] = newSchema;
        }

        break;
      }
      case actions.CREATE_SCHEMA: {
        const newSchema = {
          uid: action.uid,
          isTemporary: true,
          schema: {
            ...action.data,
            attributes: [],
          },
        };

        draftState.contentTypes[action.uid] = newSchema;

        break;
      }
      case actions.EDIT_ATTRIBUTE: {
        const {
          attributeToSet: { name, ...rest },
          forTarget,
          targetUid,
          initialAttribute,
        } = action;

        const initialAttributeName = initialAttribute.name;
        const pathToDataToEdit = ['component', 'contentType'].includes(forTarget)
          ? [forTarget]
          : [forTarget, targetUid];

        const initialAttributeIndex = findAttributeIndex(
          get(state, ['modifiedData', ...pathToDataToEdit]),
          initialAttributeName
        );

        const isEditingRelation = rest.type === 'relation';

        if (!isEditingRelation) {
          set(
            draftState,
            ['modifiedData', ...pathToDataToEdit, 'schema', 'attributes', initialAttributeIndex],
            action.attributeToSet
          );

          break;
        }

        const updatedAttributes = get(state, [
          'modifiedData',
          ...pathToDataToEdit,
          'schema',
          'attributes',
        ]).slice();

        // First create the current relation attribute updated
        const toSet = {
          name,
          relation: rest.relation,
          target: rest.target,
          targetAttribute: rest.targetAttribute,
          type: 'relation',
        };

        if (rest.private) {
          toSet.private = rest.private;
        }

        const currentAttributeIndex = updatedAttributes.findIndex(
          ({ name }) => name === initialAttribute.name
        );

        // First set it in the updatedAttributes
        if (currentAttributeIndex !== -1) {
          updatedAttributes.splice(currentAttributeIndex, 1, toSet);
        }

        let oppositeAttributeNameToRemove = null;
        let oppositeAttributeNameToUpdate = null;
        let oppositeAttributeToCreate = null;

        const currentUid = get(state, ['modifiedData', ...pathToDataToEdit, 'uid']);
        const didChangeTargetRelation = initialAttribute.target !== rest.target;
        const didCreateInternalRelation = rest.target === currentUid;
        const relationType = getRelationType(rest.relation, rest.targetAttribute);
        const initialRelationType = getRelationType(
          initialAttribute.relation,
          initialAttribute.targetAttribute
        );
        const hadInternalRelation = initialAttribute.target === currentUid;
        const didChangeRelationType = initialRelationType !== relationType;
        const shouldRemoveOppositeAttributeBecauseOfTargetChange =
          didChangeTargetRelation &&
          !didCreateInternalRelation &&
          hadInternalRelation &&
          isEditingRelation;
        const shouldRemoveOppositeAttributeBecauseOfRelationTypeChange =
          didChangeRelationType &&
          hadInternalRelation &&
          ['oneWay', 'manyWay'].includes(relationType) &&
          isEditingRelation;
        const shouldUpdateOppositeAttributeBecauseOfRelationTypeChange =
          !ONE_SIDE_RELATIONS.includes(initialRelationType) &&
          !ONE_SIDE_RELATIONS.includes(relationType) &&
          hadInternalRelation &&
          didCreateInternalRelation &&
          isEditingRelation;
        const shouldCreateOppositeAttributeBecauseOfRelationTypeChange =
          ONE_SIDE_RELATIONS.includes(initialRelationType) &&
          !ONE_SIDE_RELATIONS.includes(relationType) &&
          hadInternalRelation &&
          didCreateInternalRelation &&
          isEditingRelation;
        const shouldCreateOppositeAttributeBecauseOfTargetChange =
          didChangeTargetRelation &&
          didCreateInternalRelation &&
          !ONE_SIDE_RELATIONS.includes(relationType);

        // Store opposite attribute name to remove at the end of the loop
        if (
          shouldRemoveOppositeAttributeBecauseOfTargetChange ||
          shouldRemoveOppositeAttributeBecauseOfRelationTypeChange
        ) {
          oppositeAttributeNameToRemove = initialAttribute.targetAttribute;
        }

        // In case of oneWay or manyWay relation there isn't an opposite attribute
        if (oppositeAttributeNameToRemove) {
          const indexToRemove = updatedAttributes.findIndex(
            ({ name }) => name === oppositeAttributeNameToRemove
          );

          updatedAttributes.splice(indexToRemove, 1);
        }

        // Create the opposite attribute
        if (
          shouldCreateOppositeAttributeBecauseOfRelationTypeChange ||
          shouldCreateOppositeAttributeBecauseOfTargetChange
        ) {
          oppositeAttributeToCreate = {
            name: rest.targetAttribute,
            relation: getOppositeRelation(relationType),
            target: rest.target,
            targetAttribute: name,
            type: 'relation',
          };

          if (rest.private) {
            oppositeAttributeToCreate.private = rest.private;
          }

          const indexToInsert =
            updatedAttributes.findIndex(({ name }) => name === initialAttribute.name) + 1;

          updatedAttributes.splice(indexToInsert, 0, oppositeAttributeToCreate);
        }

        if (shouldUpdateOppositeAttributeBecauseOfRelationTypeChange) {
          oppositeAttributeNameToUpdate = initialAttribute.targetAttribute;

          oppositeAttributeToCreate = {
            name: rest.targetAttribute,
            relation: getOppositeRelation(relationType),
            target: rest.target,
            targetAttribute: name,
            type: 'relation',
          };

          if (rest.private) {
            oppositeAttributeToCreate.private = rest.private;
          }

          if (oppositeAttributeNameToUpdate) {
            const indexToUpdate = updatedAttributes.findIndex(
              ({ name }) => name === oppositeAttributeNameToUpdate
            );

            updatedAttributes.splice(indexToUpdate, 1, oppositeAttributeToCreate);
          }
        }

        set(
          draftState,
          ['modifiedData', ...pathToDataToEdit, 'schema', 'attributes'],
          updatedAttributes
        );

        break;
      }
      case actions.GET_DATA_SUCCEEDED: {
        draftState.components = action.components;
        draftState.initialComponents = action.components;
        draftState.initialContentTypes = action.contentTypes;
        draftState.contentTypes = action.contentTypes;
        draftState.reservedNames = action.reservedNames;
        draftState.isLoading = false;

        break;
      }
      case actions.DELETE_NOT_SAVED_TYPE: {
        // Doing so will also reset the modified and the initial data
        draftState.contentTypes = state.initialContentTypes;
        draftState.components = state.initialComponents;

        break;
      }
      case actions.RELOAD_PLUGIN: {
        return initialState;
      }
      case actions.REMOVE_COMPONENT_FROM_DYNAMIC_ZONE: {
        const dzAttributeIndex = findAttributeIndex(state.modifiedData.contentType, action.dzName);

        draftState.modifiedData.contentType.schema.attributes[dzAttributeIndex].components.splice(
          action.componentToRemoveIndex,
          1
        );

        break;
      }
      case actions.REMOVE_FIELD: {
        const { mainDataKey, attributeToRemoveName } = action;
        const pathToAttributes = ['modifiedData', mainDataKey, 'schema', 'attributes'];
        const attributeToRemoveIndex = findAttributeIndex(
          state.modifiedData[mainDataKey],
          attributeToRemoveName
        );

        const pathToAttributeToRemove = [...pathToAttributes, attributeToRemoveIndex];
        const attributeToRemoveData = get(state, pathToAttributeToRemove);
        const isRemovingRelationAttribute = attributeToRemoveData.type === 'relation';
        // Only content types can have relations with themselves since
        // components can only have oneWay or manyWay relations
        const canTheAttributeToRemoveHaveARelationWithItself = mainDataKey === 'contentType';

        if (isRemovingRelationAttribute && canTheAttributeToRemoveHaveARelationWithItself) {
          const { target, relation, targetAttribute } = attributeToRemoveData;
          const relationType = getRelationType(relation, targetAttribute);

          const uid = state.modifiedData.contentType.uid;
          const shouldRemoveOppositeAttribute =
            target === uid && !ONE_SIDE_RELATIONS.includes(relationType);

          if (shouldRemoveOppositeAttribute) {
            const attributes = state.modifiedData[mainDataKey].schema.attributes.slice();
            const nextAttributes = attributes.filter(attribute => {
              if (attribute.name === attributeToRemoveName) {
                return false;
              }

              if (attribute.target === uid && attribute.targetAttribute === attributeToRemoveName) {
                return false;
              }

              return true;
            });

            draftState.modifiedData[mainDataKey].schema.attributes = nextAttributes;

            break;
          }
        }

        // Find all uid fields that have the targetField set to the field we are removing
        const uidFieldsToUpdate = state.modifiedData[mainDataKey].schema.attributes
          .slice()
          .reduce((acc, current) => {
            if (current.type !== 'uid') {
              return acc;
            }

            if (current.targetField !== attributeToRemoveName) {
              return acc;
            }

            acc.push(current.name);

            return acc;
          }, []);

        uidFieldsToUpdate.forEach(fieldName => {
          const fieldIndex = findAttributeIndex(state.modifiedData[mainDataKey], fieldName);

          delete draftState.modifiedData[mainDataKey].schema.attributes[fieldIndex].targetField;
        });

        draftState.modifiedData[mainDataKey].schema.attributes.splice(attributeToRemoveIndex, 1);

        break;
      }
      case actions.REMOVE_FIELD_FROM_DISPLAYED_COMPONENT: {
        const { attributeToRemoveName, componentUid } = action;

        const attributeToRemoveIndex = findAttributeIndex(
          state.modifiedData.components[componentUid],
          attributeToRemoveName
        );

        draftState.modifiedData.components[componentUid].schema.attributes.splice(
          attributeToRemoveIndex,
          1
        );

        break;
      }
      case actions.SET_MODIFIED_DATA: {
        draftState.isLoadingForDataToBeSet = false;
        draftState.initialData = action.schemaToSet;
        draftState.modifiedData = action.schemaToSet;

        // Reset the state with the initial data
        // All created components and content types will be lost
        if (!action.hasJustCreatedSchema) {
          draftState.components = state.initialComponents;
          draftState.contentTypes = state.initialContentTypes;
        }

        break;
      }
      case actions.UPDATE_SCHEMA: {
        const {
          data: { name, collectionName, category, icon, kind },
          schemaType,
          uid,
        } = action;

        draftState.modifiedData[schemaType].schema.collectionName = collectionName;
        draftState.modifiedData[schemaType].schema.name = name;

        if (action.schemaType === 'component') {
          draftState.modifiedData.component.category = category;
          draftState.modifiedData.component.schema.icon = icon;
          const addedComponent = current(draftState.modifiedData.component);
          draftState.components[uid] = addedComponent;

          break;
        }

        draftState.modifiedData.contentType.schema.kind = kind;

        break;
      }
      default:
        return draftState;
    }
  });

export default reducer;
export { initialState };
