import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Header } from '@buffetjs/custom';
import { isEqual } from 'lodash';
import {
  FormBloc,
  PopUpWarning,
  SettingsPageTitle,
  SizedInput,
  useUserPermissions,
  request,
} from 'strapi-helper-plugin';
import pluginPermissions from '../../permissions';
import { getTrad, getRequestURL } from '../../utils';
import ListBaselineAlignment from '../../components/ListBaselineAlignment';
import form from './utils/form';
import reducer, { initialState } from './reducer';

const AdvancedSettingsPage = () => {
  const { formatMessage } = useIntl();
  const [showModalWarning, setShowModalWarning] = useState(false);
  const pageTitle = formatMessage({ id: getTrad('HeaderNav.link.advancedSettings') });
  const formTitle = formatMessage({
    id: getTrad('Form.title.advancedSettings'),
    defaultMessage: 'Settings',
  });
  const updatePermissions = useMemo(() => {
    return { update: pluginPermissions.updateAdvancedSettings };
  }, []);
  const {
    isLoading: isLoadingForPermissions,
    allowedActions: { canUpdate },
  } = useUserPermissions(updatePermissions);
  const [
    { initialData, isConfirmButtonLoading, isLoading, modifiedData, roles },
    dispatch,
  ] = useReducer(reducer, initialState);
  const isMounted = useRef(true);
  const abortController = new AbortController();
  const { signal } = abortController;

  useEffect(() => {
    const getData = async () => {
      try {
        dispatch({
          type: 'GET_DATA',
        });

        const data = await request(getRequestURL('advanced'), { method: 'GET', signal });

        dispatch({
          type: 'GET_DATA_SUCCEEDED',
          data,
        });
      } catch (err) {
        if (isMounted.current) {
          dispatch({
            type: 'GET_DATA_ERROR',
          });
          console.error(err);
          strapi.notification.toggle({
            type: 'warning',
            message: { id: 'notification.error' },
          });
        }
      }
    };

    if (!isLoadingForPermissions) {
      getData();
    }

    return () => {
      abortController.abort();
      isMounted.current = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingForPermissions]);

  const handleChange = useCallback(({ target }) => {
    dispatch({
      type: 'ON_CHANGE',
      keys: target.name,
      value: target.value,
    });
  }, []);

  const handleSubmit = useCallback(
    async e => {
      e.preventDefault();

      try {
        dispatch({
          type: 'ON_SUBMIT',
        });

        strapi.lockAppWithOverlay();
        await request(getRequestURL('advanced'), { method: 'PUT', body: modifiedData });

        dispatch({
          type: 'ON_SUBMIT_SUCCEEDED',
        });

        strapi.notification.toggle({
          type: 'success',
          message: { id: getTrad('notification.success.submit') },
        });
      } catch (err) {
        dispatch({
          type: 'ON_SUBMIT_ERROR',
        });
        console.error(err);
        strapi.notification.toggle({
          type: 'warning',
          message: { id: 'notification.error' },
        });
      }

      strapi.unlockApp();
    },
    [modifiedData]
  );

  const handleConfirmReset = useCallback(() => {
    dispatch({
      type: 'ON_RESET',
    });

    setShowModalWarning(false);
  }, []);

  const handleToggleModal = useCallback(() => {
    setShowModalWarning(prev => !prev);
  }, []);

  const headerActions = useMemo(() => {
    const isDisabled = isEqual(initialData, modifiedData);

    return [
      {
        disabled: isDisabled,
        onClick: () => {
          handleToggleModal();
        },
        color: 'cancel',
        label: formatMessage({
          id: 'app.components.Button.reset',
        }),

        type: 'button',
        style: {
          paddingLeft: 15,
          paddingRight: 15,
          fontWeight: 600,
        },
      },
      {
        disabled: isDisabled,
        color: 'success',
        label: formatMessage({
          id: 'app.components.Button.save',
        }),
        isLoading: isConfirmButtonLoading,
        type: 'submit',
        style: {
          minWidth: 150,
          fontWeight: 600,
        },
      },
    ];
  }, [initialData, isConfirmButtonLoading, modifiedData, formatMessage, handleToggleModal]);

  const showLoader = isLoadingForPermissions || isLoading;

  return (
    <>
      <SettingsPageTitle name={pageTitle} />
      <div>
        <form onSubmit={handleSubmit}>
          <Header actions={headerActions} title={{ label: pageTitle }} isLoading={showLoader} />
          <ListBaselineAlignment />
          <FormBloc title={formTitle} isLoading={showLoader}>
            {form.map(input => {
              return (
                <SizedInput
                  key={input.name}
                  {...input}
                  disabled={!canUpdate}
                  onChange={handleChange}
                  options={roles}
                  value={modifiedData[input.name]}
                />
              );
            })}
          </FormBloc>
        </form>
      </div>
      <PopUpWarning
        isOpen={showModalWarning}
        toggleModal={handleToggleModal}
        content={{
          title: getTrad('popUpWarning.title'),
          message: getTrad('popUpWarning.warning.cancel'),
          cancel: getTrad('popUpWarning.button.cancel'),
          confirm: getTrad('popUpWarning.button.confirm'),
        }}
        popUpWarningType="danger"
        onConfirm={handleConfirmReset}
      />
    </>
  );
};

export default AdvancedSettingsPage;
