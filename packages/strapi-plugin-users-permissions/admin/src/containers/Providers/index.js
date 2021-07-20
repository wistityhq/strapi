import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Header, List } from '@buffetjs/custom';
import { Text } from '@buffetjs/core';
import { Pencil } from '@buffetjs/icons';
import {
  SettingsPageTitle,
  SizedInput,
  useGlobalContext,
  getYupInnerErrors,
  request,
} from 'strapi-helper-plugin';
import { get, upperFirst, has } from 'lodash';
import { Row } from 'reactstrap';
import pluginPermissions from '../../permissions';
import { useForm } from '../../hooks';
import { getRequestURL, getTrad } from '../../utils';
import ListBaselineAlignment from '../../components/ListBaselineAlignment';
import ListRow from '../../components/ListRow';
import ModalForm from '../../components/ModalForm';
import createProvidersArray from './utils/createProvidersArray';
import forms from './utils/forms';

const ProvidersPage = () => {
  const { formatMessage } = useIntl();
  const { emitEvent } = useGlobalContext();
  const emitEventRef = useRef(emitEvent);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmiting, setIsSubmiting] = useState(false);
  const buttonSubmitRef = useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [providerToEditName, setProviderToEditName] = useState(null);

  const updatePermissions = useMemo(() => {
    return { update: pluginPermissions.updateProviders };
  }, []);

  const {
    allowedActions: { canUpdate },
    dispatchResetForm,
    dispatchSetFormErrors,
    dispatchSubmitSucceeded,
    formErrors,
    handleChange,
    isLoading,
    isLoadingForPermissions,
    modifiedData,
  } = useForm('providers', updatePermissions);

  const providers = useMemo(() => createProvidersArray(modifiedData), [modifiedData]);
  const enabledProvidersCount = useMemo(
    () => providers.filter(provider => provider.enabled).length,
    [providers]
  );
  const isGenericProvider = useMemo(() => {
    if (!providerToEditName) {
      return false;
    }

    const providerToEdit = providers.find(obj => obj.name === providerToEditName);
    console.log(providerToEdit);

    return has(providerToEdit, 'authorize_url');
  }, [providers, providerToEditName]);
  const isProviderWithSubdomain = useMemo(() => {
    if (!providerToEditName) {
      return false;
    }

    const providerToEdit = providers.find(obj => obj.name === providerToEditName);

    return has(providerToEdit, 'subdomain');
  }, [providers, providerToEditName]);
  const disabledProvidersCount = useMemo(() => {
    return providers.length - enabledProvidersCount;
  }, [providers, enabledProvidersCount]);

  const listTitle = useMemo(() => {
    const enabledMessage = formatMessage(
      {
        id: getTrad(
          `List.title.providers.enabled.${enabledProvidersCount > 1 ? 'plural' : 'singular'}`
        ),
      },
      { number: enabledProvidersCount }
    );
    const disabledMessage = formatMessage(
      {
        id: getTrad(
          `List.title.providers.disabled.${disabledProvidersCount > 1 ? 'plural' : 'singular'}`
        ),
      },
      { number: disabledProvidersCount }
    );

    return `${enabledMessage} ${disabledMessage}`;
  }, [formatMessage, enabledProvidersCount, disabledProvidersCount]);

  const pageTitle = formatMessage({ id: getTrad('HeaderNav.link.providers') });

  const formToRender = useMemo(() => {
    if (providerToEditName === 'email') {
      return forms.email;
    }

    if (isProviderWithSubdomain) {
      return forms.providersWithSubdomain;
    }

    if (isGenericProvider) {
      return forms.genericProviders;
    }

    return forms.providers;
  }, [providerToEditName, isProviderWithSubdomain, isGenericProvider]);

  const handleClick = useCallback(() => {
    buttonSubmitRef.current.click();
  }, []);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleClickEdit = useCallback(
    provider => {
      if (canUpdate) {
        setProviderToEditName(provider.name);
        handleToggle();
      }
    },
    [canUpdate, handleToggle]
  );

  const handleClosed = useCallback(() => {
    setProviderToEditName(null);
    setShowForm(false);
    dispatchResetForm();
  }, [dispatchResetForm]);

  const handleOpened = useCallback(() => {
    setShowForm(true);
  }, []);

  const handleSubmit = useCallback(
    async e => {
      e.preventDefault();
      const { schema } = formToRender;
      let errors = {};

      setIsSubmiting(true);

      try {
        await schema.validate(modifiedData[providerToEditName], { abortEarly: false });
        strapi.lockAppWithOverlay();

        try {
          emitEventRef.current('willEditAuthenticationProvider');

          await request(getRequestURL('providers'), {
            method: 'PUT',
            body: { providers: modifiedData },
          });

          emitEventRef.current('didEditAuthenticationProvider');

          strapi.notification.toggle({
            type: 'success',
            message: { id: getTrad('notification.success.submit') },
          });

          dispatchSubmitSucceeded();

          handleToggle();
        } catch (err) {
          console.error(err);
          strapi.notification.toggle({
            type: 'warning',
            message: { id: 'notification.error' },
          });
        }
      } catch (err) {
        console.error(err);
        errors = getYupInnerErrors(err);
        console.log(errors);
      }

      dispatchSetFormErrors(errors);

      setIsSubmiting(false);
      strapi.unlockApp();
    },
    [
      dispatchSetFormErrors,
      dispatchSubmitSucceeded,
      formToRender,
      handleToggle,
      modifiedData,
      providerToEditName,
    ]
  );

  return (
    <>
      <SettingsPageTitle name={pageTitle} />
      <div>
        <Header title={{ label: pageTitle }} isLoading={isLoadingForPermissions || isLoading} />
        <ListBaselineAlignment />
        <List
          title={listTitle}
          items={providers}
          isLoading={isLoadingForPermissions || isLoading}
          customRowComponent={provider => (
            <ListRow
              {...provider}
              onClick={() => handleClickEdit(provider)}
              links={[
                {
                  icon: canUpdate ? <Pencil fill="#0e1622" /> : null,
                  onClick: e => {
                    e.stopPropagation();
                    handleClickEdit(provider);
                  },
                },
              ]}
            >
              <td key="enabled">
                <Text
                  fontWeight="semiBold"
                  lineHeight="18px"
                  color={provider.enabled ? 'green' : 'lightOrange'}
                >
                  {provider.enabled ? 'Enabled' : 'Disabled'}
                </Text>
              </td>
            </ListRow>
          )}
        />
      </div>
      <ModalForm
        isOpen={isOpen}
        onClick={handleClick}
        onCancel={handleToggle}
        isLoading={isSubmiting}
        onOpened={handleOpened}
        onClosed={handleClosed}
        onToggle={handleToggle}
        headerBreadcrumbs={[
          getTrad('PopUpForm.header.edit.providers'),
          upperFirst(providerToEditName),
        ]}
      >
        {showForm && (
          <form onSubmit={handleSubmit}>
            <Row>
              {formToRender.form.map(input => {
                const label = input.label.params
                  ? { ...input.label, params: { provider: upperFirst(providerToEditName) } }
                  : input.label;

                const value =
                  input.name === 'noName'
                    ? `${strapi.backendURL}/connect/${providerToEditName}/callback`
                    : get(modifiedData, [providerToEditName, ...input.name.split('.')], '');

                return (
                  <SizedInput
                    key={input.name}
                    {...input}
                    label={label}
                    error={formErrors[input.name]}
                    name={`${providerToEditName}.${input.name}`}
                    onChange={handleChange}
                    value={value}
                  />
                );
              })}
            </Row>
            <button type="submit" style={{ display: 'none' }} ref={buttonSubmitRef}>
              hidden button to use the native form event
            </button>
          </form>
        )}
      </ModalForm>
    </>
  );
};

export default ProvidersPage;
