import produce from 'immer';
import pluralize from 'pluralize';
import set from 'lodash/set';
import snakeCase from 'lodash/snakeCase';
import getRelationType from '../../utils/getRelationType';
import makeUnique from '../../utils/makeUnique';
import { createComponentUid } from './utils/createUid';
import { shouldPluralizeName, shouldPluralizeTargetAttribute } from './utils/relations';
import * as actions from './constants';

const initialState = {
  formErrors: {},
  modifiedData: {},
  initialData: {},
  componentToCreate: {},
  isCreatingComponentWhileAddingAField: false,
};

const reducer = (state = initialState, action) =>
  // eslint-disable-next-line consistent-return
  produce(state, draftState => {
    switch (action.type) {
      case actions.ADD_COMPONENTS_TO_DYNAMIC_ZONE: {
        const { components, shouldAddComponents } = action;
        let currentList = [];

        if (shouldAddComponents) {
          currentList = [...state.modifiedData.components, ...components];
        } else {
          currentList = state.modifiedData.components.filter(comp => {
            return components.indexOf(comp) === -1;
          });
        }

        draftState.modifiedData.components = makeUnique(currentList);

        break;
      }
      case actions.ON_CHANGE: {
        const { keys, value } = action;
        const obj = state.modifiedData;
        const hasDefaultValue = Boolean(obj.default);

        // There is no need to remove the default key if the default value isn't defined
        if (hasDefaultValue && keys.length === 1 && keys.includes('type')) {
          const previousType = obj.type;

          if (previousType && ['date', 'datetime', 'time'].includes(previousType)) {
            // return obj.updateIn(keys, () => value).remove('default');
            delete draftState.modifiedData.default;
          }
        }

        set(draftState, ['modifiedData', ...keys], value);

        break;
      }
      case actions.ON_CHANGE_RELATION_TARGET: {
        const {
          target: {
            oneThatIsCreatingARelationWithAnother,
            selectedContentTypeFriendlyName,
            targetContentTypeAllowedRelations,
            value,
          },
        } = action;
        // Special case for the admin user...
        let didChangeRelationTypeBecauseOfRestrictedRelation = false;
        let changedRelationType = null;

        set(draftState, ['modifiedData', 'target'], value);

        const modifiedData = state.modifiedData;

        // Don't change the relation type if the allowed relations are not restricted
        // TODO: replace with an obj { relation: 'x', bidirctional: true|false } when BE ready
        if (Array.isArray(targetContentTypeAllowedRelations)) {
          const currentRelationType = getRelationType(
            modifiedData.relation,
            modifiedData.targetAttribute
          );

          if (!targetContentTypeAllowedRelations.includes(currentRelationType)) {
            const relationToSet = targetContentTypeAllowedRelations[0];
            didChangeRelationTypeBecauseOfRestrictedRelation = true;
            changedRelationType = relationToSet;

            if (relationToSet === 'oneWay') {
              set(draftState, ['modifiedData', 'relation'], 'oneToOne');
            } else if (relationToSet === 'manyWay') {
              set(draftState, ['modifiedData', 'relation'], 'oneToMany');
            } else {
              set(draftState, ['modifiedData', 'relation'], relationToSet);
            }
          }
        }

        let nameToSet;

        if (didChangeRelationTypeBecauseOfRestrictedRelation) {
          nameToSet = pluralize(
            snakeCase(selectedContentTypeFriendlyName),
            shouldPluralizeName(changedRelationType)
          );
        } else {
          nameToSet = pluralize(
            snakeCase(selectedContentTypeFriendlyName),

            shouldPluralizeName(modifiedData.relation)
          );
        }

        set(draftState, ['modifiedData', 'name'], nameToSet);

        const currentTargetAttribute = state.modifiedData.targetAttribute;

        if (currentTargetAttribute === null) {
          break;
        }

        // Changing the target and the relation is either oneWay or manyWay
        // Case when we need to change the relation to oneWay (ex: admin user)
        if (
          didChangeRelationTypeBecauseOfRestrictedRelation &&
          ['oneWay', 'manyWay'].includes(changedRelationType)
        ) {
          set(draftState, ['modifiedData', 'targetAttribute'], null);

          break;
        }

        const targetAttributeToSet = pluralize(
          snakeCase(oneThatIsCreatingARelationWithAnother),
          shouldPluralizeTargetAttribute(modifiedData.relation)
        );

        set(draftState, ['modifiedData', 'targetAttribute'], targetAttributeToSet);

        break;
      }
      case actions.ON_CHANGE_RELATION_TYPE: {
        const {
          target: { oneThatIsCreatingARelationWithAnother, value },
        } = action;

        const currentName = state.modifiedData.name;

        // Switching from oneWay
        if (!['oneWay', 'manyWay'].includes(value)) {
          set(draftState, ['modifiedData', 'relation'], value);
          const currentTargetAttribute = state.modifiedData.targetAttribute;

          set(
            draftState,
            ['modifiedData', 'name'],
            pluralize(snakeCase(currentName), shouldPluralizeName(value))
          );

          set(
            draftState,
            ['modifiedData', 'targetAttribute'],
            pluralize(
              currentTargetAttribute || snakeCase(oneThatIsCreatingARelationWithAnother),
              shouldPluralizeTargetAttribute(value)
            )
          );

          break;
        }

        if (value === 'oneWay') {
          set(draftState, ['modifiedData', 'relation'], 'oneToOne');
          set(draftState, ['modifiedData', 'targetAttribute'], null);
          set(draftState, ['modifiedData', 'name'], pluralize(snakeCase(currentName), 1));

          break;
        }

        // manyWay
        set(draftState, ['modifiedData', 'relation'], 'oneToMany');
        set(draftState, ['modifiedData', 'targetAttribute'], null);
        set(draftState, ['modifiedData', 'name'], pluralize(snakeCase(currentName), 2));

        break;
      }
      case actions.ON_CHANGE_ALLOWED_TYPE: {
        if (action.name === 'all') {
          if (action.value) {
            set(draftState, ['modifiedData', 'allowedTypes'], ['images', 'videos', 'files']);
            break;
          }

          set(draftState, ['modifiedData', 'allowedTypes'], null);

          break;
        }

        const currentList = state.modifiedData.allowedTypes || [];
        let updatedList = [...currentList];

        if (currentList.includes(action.name)) {
          updatedList = updatedList.filter(v => v !== action.name);

          if (updatedList.length === 0) {
            set(draftState, ['modifiedData', 'allowedTypes'], null);

            break;
          }

          set(draftState, ['modifiedData', 'allowedTypes'], updatedList);
          break;
        }

        updatedList.push(action.name);

        set(draftState, ['modifiedData', 'allowedTypes'], updatedList);

        break;
      }
      case actions.RESET_PROPS:
        return initialState;
      case actions.RESET_PROPS_AND_SET_FORM_FOR_ADDING_AN_EXISTING_COMPO: {
        // This is run when the user doesn't want to create a new component

        const nextState = {
          ...initialState,
          modifiedData: {
            type: 'component',
            repeatable: true,
            ...action.options,
          },
        };

        return nextState;
      }
      case actions.RESET_PROPS_AND_SAVE_CURRENT_DATA: {
        // This is run when the user has created a new component
        const componentToCreate = state.modifiedData.componentToCreate;
        const modifiedData = {
          name: componentToCreate.name,
          type: 'component',
          repeatable: false,
          ...action.options,
          component: createComponentUid(componentToCreate.name, componentToCreate.category),
        };

        const nextState = {
          ...initialState,
          componentToCreate,
          modifiedData,
          isCreatingComponentWhileAddingAField: state.modifiedData.createComponent,
        };

        return nextState;
      }
      case actions.RESET_PROPS_AND_SET_THE_FORM_FOR_ADDING_A_COMPO_TO_A_DZ: {
        const createdDZ = state.modifiedData;
        const dataToSet = {
          ...createdDZ,
          createComponent: true,
          componentToCreate: { type: 'component' },
        };

        return { ...initialState, modifiedData: dataToSet };
      }
      case actions.SET_DATA_TO_EDIT: {
        draftState.modifiedData = action.data;
        draftState.initialData = action.data;
        break;
      }
      case actions.SET_ATTRIBUTE_DATA_SCHEMA: {
        const {
          attributeType,
          isEditing,
          modifiedDataToSetForEditing,
          nameToSetForRelation,
          targetUid,
          step,
          options = {},
        } = action;

        if (isEditing) {
          draftState.modifiedData = modifiedDataToSetForEditing;
          draftState.initialData = modifiedDataToSetForEditing;

          break;
        }

        let dataToSet;

        if (attributeType === 'component') {
          if (step === '1') {
            dataToSet = {
              type: 'component',
              createComponent: true,
              componentToCreate: { type: 'component' },
            };
          } else {
            dataToSet = {
              ...options,
              type: 'component',
              repeatable: true,
            };
          }
        } else if (attributeType === 'dynamiczone') {
          dataToSet = {
            ...options,
            type: 'dynamiczone',
            components: [],
          };
        } else if (attributeType === 'text') {
          dataToSet = { ...options, type: 'string' };
        } else if (attributeType === 'number' || attributeType === 'date') {
          dataToSet = options;
        } else if (attributeType === 'media') {
          dataToSet = {
            allowedTypes: ['images', 'files', 'videos'],
            type: 'media',
            multiple: true,
            ...options,
          };
        } else if (attributeType === 'enumeration') {
          dataToSet = { ...options, type: 'enumeration', enum: [] };
        } else if (attributeType === 'relation') {
          dataToSet = {
            name: snakeCase(nameToSetForRelation),
            relation: 'oneToOne',
            targetAttribute: null,
            target: targetUid,
            type: 'relation',
          };
        } else {
          dataToSet = { ...options, type: attributeType, default: null };
        }

        draftState.modifiedData = dataToSet;

        break;
      }
      case actions.SET_DYNAMIC_ZONE_DATA_SCHEMA: {
        draftState.modifiedData = action.attributeToEdit;
        draftState.initialData = action.attributeToEdit;
        break;
      }
      case actions.SET_ERRORS: {
        draftState.formErrors = action.errors;
        break;
      }
      default:
        return draftState;
    }
  });

export default reducer;
export { initialState };
