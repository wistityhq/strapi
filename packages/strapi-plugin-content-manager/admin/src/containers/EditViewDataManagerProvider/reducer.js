import { fromJS } from 'immutable';
import { getMaxTempKey } from '../../utils';

const initialState = fromJS({
  componentsDataStructure: {},
  contentTypeDataStructure: {},
  formErrors: {},
  initialData: {},
  modifiedData: {},
  shouldCheckErrors: false,
  modifiedDZName: null,
});

const reducer = (state, action) => {
  switch (action.type) {
    case 'ADD_NON_REPEATABLE_COMPONENT_TO_FIELD':
      return state.updateIn(['modifiedData', ...action.keys], () => {
        const defaultDataStructure = state.getIn(['componentsDataStructure', action.componentUid]);

        return fromJS(defaultDataStructure);
      });
    case 'ADD_REPEATABLE_COMPONENT_TO_FIELD': {
      return state
        .updateIn(['modifiedData', ...action.keys], list => {
          const defaultDataStructure = state
            .getIn(['componentsDataStructure', action.componentUid])
            .set('__temp_key__', getMaxTempKey(list ? list.toJS() : []) + 1);

          if (list) {
            return list.push(defaultDataStructure);
          }

          return fromJS([defaultDataStructure]);
        })
        .update('shouldCheckErrors', v => {
          if (action.shouldCheckErrors === true) {
            return !v;
          }

          return v;
        });
    }
    case 'ADD_COMPONENT_TO_DYNAMIC_ZONE':
      return state
        .updateIn(['modifiedData', ...action.keys], list => {
          const defaultDataStructure = state
            .getIn(['componentsDataStructure', action.componentUid])
            .set('__component', action.componentUid);

          if (list) {
            return list.push(defaultDataStructure);
          }

          return fromJS([defaultDataStructure]);
        })
        .update('modifiedDZName', () => action.keys[0])
        .update('shouldCheckErrors', v => {
          if (action.shouldCheckErrors === true) {
            return !v;
          }

          return v;
        });
    case 'ADD_RELATION':
      return state.updateIn(['modifiedData', ...action.keys], list => {
        if (!Array.isArray(action.value) || !action.value.length) {
          return list;
        }

        const el = action.value[0].value;

        if (list) {
          return list.push(fromJS(el));
        }

        return fromJS([el]);
      });
    case 'INIT_FORM': {
      return state
        .update('formErrors', () => fromJS({}))
        .update('initialData', () => fromJS(action.initialValues))
        .update('modifiedData', () => fromJS(action.initialValues))
        .update('modifiedDZName', () => null)
        .update('shouldCheckErrors', () => false);
    }
    case 'MOVE_COMPONENT_FIELD':
      return state.updateIn(['modifiedData', ...action.pathToComponent], list => {
        return list
          .delete(action.dragIndex)
          .insert(
            action.hoverIndex,
            state.getIn(['modifiedData', ...action.pathToComponent, action.dragIndex])
          );
      });
    case 'MOVE_COMPONENT':
      return state
        .update('shouldCheckErrors', v => {
          if (action.shouldCheckErrors) {
            return !v;
          }

          return v;
        })
        .updateIn(['modifiedData', action.dynamicZoneName], list => {
          return list
            .delete(action.currentIndex)
            .insert(
              action.currentIndex + action.offset,
              state.getIn(['modifiedData', action.dynamicZoneName, action.currentIndex])
            );
        });
    case 'MOVE_FIELD':
      return state.updateIn(['modifiedData', ...action.keys], list => {
        return list.delete(action.dragIndex).insert(action.overIndex, list.get(action.dragIndex));
      });
    case 'ON_CHANGE': {
      let newState = state;
      const [nonRepeatableComponentKey] = action.keys;

      // This is used to set the initialData for inputs
      // that needs an asynchronous initial value like the UID field
      // This is just a temporary patch.
      // TODO : Refactor the default form creation (workflow) to accept async default values.
      if (action.shouldSetInitialValue) {
        newState = state.updateIn(['initialData', ...action.keys], () => {
          return action.value;
        });
      }

      if (
        action.keys.length === 2 &&
        state.getIn(['modifiedData', nonRepeatableComponentKey]) === null
      ) {
        newState = newState.updateIn(['modifiedData', nonRepeatableComponentKey], () => fromJS({}));
      }

      return newState.updateIn(['modifiedData', ...action.keys], () => {
        return action.value;
      });
    }
    case 'REMOVE_COMPONENT_FROM_DYNAMIC_ZONE':
      return state
        .update('shouldCheckErrors', v => {
          if (action.shouldCheckErrors) {
            return !v;
          }

          return v;
        })
        .deleteIn(['modifiedData', action.dynamicZoneName, action.index]);
    case 'REMOVE_COMPONENT_FROM_FIELD': {
      const componentPathToRemove = ['modifiedData', ...action.keys];

      return state.updateIn(componentPathToRemove, () => null);
    }
    case 'REMOVE_PASSWORD_FIELD': {
      return state.removeIn(['modifiedData', ...action.keys]);
    }
    case 'REMOVE_REPEATABLE_FIELD': {
      const componentPathToRemove = ['modifiedData', ...action.keys];

      return state
        .update('shouldCheckErrors', v => {
          const hasErrors = state.get('formErrors').keySeq().size > 0;

          if (hasErrors) {
            return !v;
          }

          return v;
        })
        .deleteIn(componentPathToRemove);
    }
    case 'REMOVE_RELATION':
      return state.removeIn(['modifiedData', ...action.keys.split('.')]);
    case 'SET_DEFAULT_DATA_STRUCTURES':
      return state
        .update('componentsDataStructure', () => fromJS(action.componentsDataStructure))
        .update('contentTypeDataStructure', () => fromJS(action.contentTypeDataStructure));
    case 'SET_FORM_ERRORS': {
      return state
        .update('modifiedDZName', () => null)
        .update('formErrors', () => fromJS(action.errors));
    }
    case 'TRIGGER_FORM_VALIDATION':
      return state.update('shouldCheckErrors', v => {
        const hasErrors = state.get('formErrors').keySeq().size > 0;

        if (hasErrors) {
          return !v;
        }

        return v;
      });
    default:
      return state;
  }
};

export default reducer;
export { initialState };
