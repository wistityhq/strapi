import { createSelector } from 'reselect';
import pluginId from '../../pluginId';
import { initialState } from './reducer';

/**
 * Direct selector to the dataManagerProvider state domain
 */
const dataManagerProviderDomain = () => state =>
  state[`${pluginId}_dataManagerProvider`] || initialState;

/**
 * Other specific selectors
 */

/**
 * Default selector used by dataManagerProvider
 */

const makeSelectDataManagerProvider = () =>
  createSelector(dataManagerProviderDomain(), substate => {
    return substate;
  });

export default makeSelectDataManagerProvider;
export { dataManagerProviderDomain };
