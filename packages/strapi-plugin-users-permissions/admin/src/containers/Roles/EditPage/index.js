import React, { useState, useRef } from 'react';
import { Header } from '@buffetjs/custom';
import { Padded } from '@buffetjs/core';
import { Formik } from 'formik';
import { useIntl } from 'react-intl';
import { useRouteMatch } from 'react-router-dom';
import { request, useGlobalContext } from 'strapi-helper-plugin';

import BaselineAlignement from '../../../components/BaselineAlignement';
import ContainerFluid from '../../../components/ContainerFluid';
import FormCard from '../../../components/FormBloc';
import SizedInput from '../../../components/SizedInput';
import getTrad from '../../../utils/getTrad';
import pluginId from '../../../pluginId';
import UsersPermissions from '../../../components/UsersPermissions';
import { usePlugins, useFetchRole } from '../../../hooks';

import schema from './utils/schema';

const EditPage = () => {
  const { formatMessage } = useIntl();
  const [isSubmiting, setIsSubmiting] = useState(false);
  const { settingsBaseURL } = useGlobalContext();
  const {
    params: { id },
  } = useRouteMatch(`${settingsBaseURL}/${pluginId}/roles/:id`);
  const { routes, policies, isLoading } = usePlugins();
  const { role, isLoading: isRoleLoading, onSubmitSucceeded } = useFetchRole(id);
  const permissionsRef = useRef();

  const headerActions = (handleSubmit, handleReset) => {
    if (isLoading) {
      return [];
    }

    return [
      {
        label: formatMessage({
          id: 'app.components.Button.reset',
          defaultMessage: 'Reset',
        }),
        onClick: () => {
          handleReset();
          permissionsRef.current.resetForm();
        },
        color: 'cancel',
        type: 'button',
      },
      {
        label: formatMessage({
          id: 'app.components.Button.save',
          defaultMessage: 'Save',
        }),
        onClick: handleSubmit,
        color: 'success',
        type: 'submit',
        isLoading: isSubmiting,
      },
    ];
  };

  const handleCreateRoleSubmit = data => {
    strapi.lockAppWithOverlay();
    setIsSubmiting(true);

    const permissions = permissionsRef.current.getPermissions();

    Promise.resolve(
      request(`/${pluginId}/roles/${id}`, {
        method: 'PUT',
        body: { ...data, ...permissions, users: [] },
      })
    )
      .then(() => {
        onSubmitSucceeded({ name: data.name, description: data.description });
        permissionsRef.current.setFormAfterSubmit();
        strapi.notification.toggle({
          type: 'success',
          message: { id: getTrad('Settings.roles.edited') },
        });
      })
      .catch(err => {
        console.error(err);
        strapi.notification.toggle({
          type: 'warning',
          message: { id: 'notification.error' },
        });
      })
      .finally(() => {
        setIsSubmiting(false);
        strapi.unlockApp();
      });
  };

  return (
    <Formik
      enableReinitialize
      initialValues={{ name: role.name, description: role.description }}
      onSubmit={handleCreateRoleSubmit}
      validationSchema={schema}
    >
      {({ handleSubmit, values, errors, handleReset, handleChange, handleBlur }) => (
        <form onSubmit={handleSubmit}>
          <ContainerFluid padding="0">
            <Header
              title={{
                label: role.name,
              }}
              content={role.description}
              actions={headerActions(handleSubmit, handleReset)}
              isLoading={isRoleLoading}
            />
            <BaselineAlignement top size="3px" />
            <FormCard
              title={formatMessage({
                id: getTrad('EditPage.form.roles'),
                defaultMessage: 'Role details',
              })}
              isLoading={isLoading}
            >
              <SizedInput
                label="Settings.roles.form.input.name"
                defaultMessage="Name"
                name="name"
                type="text"
                error={errors.name ? { id: errors.name } : null}
                onBlur={handleBlur}
                value={values.name}
                onChange={handleChange}
              />
              <SizedInput
                label="Settings.roles.form.input.description"
                defaultMessage="Description"
                name="description"
                type="textarea"
                error={errors.description ? { id: errors.description } : null}
                onBlur={handleBlur}
                value={values.description}
                onChange={handleChange}
                // Override the default height of the textarea
                style={{ height: 115 }}
              />
            </FormCard>
          </ContainerFluid>
          <div style={{ paddingTop: '1.8rem' }} />
          {!isLoading && !isRoleLoading && (
            <UsersPermissions
              ref={permissionsRef}
              permissions={role.permissions}
              routes={routes}
              policies={policies}
            />
          )}
          <Padded top size="md" />
        </form>
      )}
    </Formik>
  );
};

export default EditPage;
