import React, { memo, useReducer, useCallback, forwardRef, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import { Padded, Flex } from '@buffetjs/core';
import { useIntl } from 'react-intl';

import FormCard from '../FormBloc';
import getTrad from '../../utils/getTrad';
import Policies from '../Policies';
import Permissions from '../Permissions';
import reducer, { initialState } from './reducer';
import { UsersPermissionsProvider } from '../../contexts/UsersPermissionsContext';
import init from './init';
import RolePicker from '../Roles/RolePicker';

const UsersPermissions = forwardRef(({ permissions, routes, policies }, ref) => {
  const { formatMessage } = useIntl();
  const [state, dispatch] = useReducer(reducer, initialState, state =>
    init(state, permissions, routes, policies)
  );

  useImperativeHandle(ref, () => ({
    getPermissions: () => {
      return {
        permissions: state.modifiedData,
      };
    },
    resetForm: () => {
      dispatch({ type: 'ON_RESET' });
    },
    setFormAfterSubmit: () => {
      dispatch({ type: 'ON_SUBMIT_SUCCEEDED' });
    },
  }));

  const handleChange = useCallback(({ target: { name, value } }) => {
    dispatch({
      type: 'ON_CHANGE',
      keys: name.split('.'),
      value: value === 'empty__string_value' ? '' : value,
    });
  }, []);

  const handleChangeSelectAll = useCallback(({ target: { name, value } }) => {
    dispatch({
      type: 'ON_CHANGE_SELECT_ALL',
      keys: name.split('.'),
      value,
    });
  }, []);

  const handleSelectedAction = useCallback(actionToSelect => {
    dispatch({
      type: 'SELECT_ACTION',
      actionToSelect,
    });
  }, []);

  const handleRoleChange = useCallback(role => {
    dispatch({
      type: 'ON_COPY_EXISTING_ROLE',
      keys: Object.keys(role.permissions),
      value: role.permissions,
    });
  }, []);

  const providerValue = {
    ...state,
    onChange: handleChange,
    onChangeSelectAll: handleChangeSelectAll,
    onSelectedAction: handleSelectedAction,
  };

  const actions = [
    <RolePicker
      key="copy-role"
      label={formatMessage({
        id: 'Settings.roles.copy-role',
        defaultMessage: 'Copy a existing role',
      })}
      onChange={handleRoleChange}
    />,
  ];

  return (
    <UsersPermissionsProvider value={providerValue}>
      <Flex>
        <FormCard
          title={formatMessage({
            id: getTrad('Plugins.header.title'),
          })}
          subtitle={formatMessage({
            id: getTrad('Plugins.header.description'),
          })}
          actions={actions}
        >
          <Padded left right size="xs">
            <Permissions />
          </Padded>
        </FormCard>
        <Policies />
      </Flex>
    </UsersPermissionsProvider>
  );
});

UsersPermissions.propTypes = {
  permissions: PropTypes.object.isRequired,
  routes: PropTypes.object.isRequired,
  policies: PropTypes.array.isRequired,
};

export default memo(UsersPermissions);
