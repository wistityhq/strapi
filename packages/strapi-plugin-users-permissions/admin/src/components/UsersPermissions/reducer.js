/* eslint-disable consistent-return */
import produce from 'immer';
import { set, get, take } from 'lodash';

export const initialState = {
  initialData: {},
  modifiedData: {},
  routes: {},
  selectedAction: '',
  policies: [],
};

const reducer = (state, action) =>
  produce(state, draftState => {
    switch (action.type) {
      case 'ON_CHANGE': {
        const keysLength = action.keys.length;
        const isChangingCheckbox = action.keys[keysLength - 1] === 'enabled';

        if (action.value && isChangingCheckbox) {
          const selectedAction = take(action.keys, keysLength - 1).join('.');
          draftState.selectedAction = selectedAction;
        }

        set(draftState, ['modifiedData', ...action.keys], action.value);
        break;
      }
      case 'ON_CHANGE_SELECT_ALL': {
        const pathToValue = ['modifiedData', ...action.keys];
        const oldValues = get(state, pathToValue, {});
        const updatedValues = Object.keys(oldValues).reduce((acc, current) => {
          acc[current] = { ...oldValues[current], enabled: action.value };

          return acc;
        }, {});

        set(draftState, pathToValue, updatedValues);

        break;
      }
      case 'ON_RESET': {
        draftState.modifiedData = state.initialData;
        break;
      }
      case 'ON_SUBMIT_SUCCEEDED': {
        draftState.initialData = state.modifiedData;
        break;
      }
      case 'ON_COPY_EXISTING_ROLE': {
        set(draftState, ['modifiedData'], action.value);
        break;
      }

      case 'SELECT_ACTION': {
        const { actionToSelect } = action;
        draftState.selectedAction = actionToSelect === state.selectedAction ? '' : actionToSelect;
        break;
      }
      default:
        return draftState;
    }
  });

export default reducer;
