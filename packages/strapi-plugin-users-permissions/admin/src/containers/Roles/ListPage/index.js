import React, { useCallback, useMemo, useState } from 'react';
import { List, Header } from '@buffetjs/custom';
import { Helmet } from 'react-helmet';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useUserPermissions, PopUpWarning, request, useGlobalContext } from 'strapi-helper-plugin';

import permissions from '../../../permissions';
import { EmptyRole, RoleListWrapper, RoleRow } from '../../../components/Roles';
import { useRolesList } from '../../../hooks';
import BaselineAlignment from './BaselineAlignment';
import pluginId from '../../../pluginId';
import { getTrad } from '../../../utils';

const RoleListPage = () => {
  const { formatMessage } = useIntl();
  const { emitEvent } = useGlobalContext();
  const { push } = useHistory();

  const [modalToDelete, setModalDelete] = useState();
  const [shouldRefetchData, setShouldRefetchData] = useState(false);
  const [showModalConfirmButtonLoading, setModalButtonLoading] = useState(false);

  const updatePermissions = useMemo(() => {
    return {
      update: permissions.updateRole,
      create: permissions.createRole,
      delete: permissions.deleteRole,
      read: permissions.readRoles,
    };
  }, []);
  const {
    isLoading: isLoadingForPermissions,
    allowedActions: { canCreate, canUpdate, canDelete, canRead },
  } = useUserPermissions(updatePermissions);
  const shouldFetchData = !isLoadingForPermissions && canRead;

  const { roles, getData, isLoading } = useRolesList(shouldFetchData);

  const handleGoTo = id => {
    if (canUpdate) {
      push(`/settings/${pluginId}/roles/${id}`);
    }
  };

  const handleDelete = () => {
    strapi.lockAppWithOverlay();

    setModalButtonLoading(true);

    Promise.resolve(
      request(`/${pluginId}/roles/${modalToDelete}`, {
        method: 'DELETE',
      })
    )
      .then(() => {
        setShouldRefetchData(true);
        strapi.notification.toggle({
          type: 'success',
          message: { id: getTrad('Settings.roles.deleted') },
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
        setModalDelete(null);
        strapi.unlockApp();
      });
  };

  const handleClosedModalDelete = () => {
    if (shouldRefetchData) {
      getData();
    }
    setModalButtonLoading(false);
    setShouldRefetchData(false);
  };

  const handleNewRoleClick = () => {
    emitEvent('willCreateRole');
    push(`/settings/${pluginId}/roles/new`);
  };

  /* eslint-disable indent */
  const headerActions = canCreate
    ? [
        {
          label: formatMessage({
            id: getTrad('List.button.roles'),
            defaultMessage: 'Add new role',
          }),
          onClick: handleNewRoleClick,
          color: 'primary',
          type: 'button',
          icon: true,
        },
      ]
    : [];
  /* eslint-enable indent */

  const checkCanDeleteRole = useCallback(
    role => {
      return canDelete && !['public', 'authenticated'].includes(role.type);
    },
    [canDelete]
  );

  const getLinks = role => {
    const links = [];

    if (canUpdate) {
      links.push({
        icon: <FontAwesomeIcon icon="pencil-alt" />,
        onClick: () => handleGoTo(role.id),
      });
    }
    if (checkCanDeleteRole(role)) {
      links.push({
        icon: <FontAwesomeIcon icon="trash-alt" />,
        onClick: e => {
          e.preventDefault();
          setModalDelete(role.id);
          e.stopPropagation();
        },
      });
    }

    return links;
  };

  return (
    <>
      <Helmet title={formatMessage({ id: getTrad('page.title') })} />

      <Header
        icon
        title={{
          label: formatMessage({
            id: 'Settings.roles.title',
            defaultMessage: 'Roles & Permissions',
          }),
        }}
        content={formatMessage({
          id: 'Settings.roles.list.description',
          defaultMessage: 'Define the roles and permissions for your users.',
        })}
        actions={headerActions}
        // Show a loader in the header while requesting data
        isLoading={isLoading || isLoadingForPermissions}
      />

      <BaselineAlignment />
      {canRead && (
        <RoleListWrapper>
          <List
            title={formatMessage(
              {
                id: `Settings.roles.list.title${roles.length > 1 ? '.plural' : '.singular'}`,
              },
              { number: roles.length }
            )}
            items={roles}
            isLoading={isLoading || isLoadingForPermissions}
            customRowComponent={role => (
              <RoleRow onClick={() => handleGoTo(role.id)} links={getLinks(role)} role={role} />
            )}
          />
          {!roles && !isLoading && !isLoadingForPermissions && <EmptyRole />}
          <PopUpWarning
            isOpen={Boolean(modalToDelete)}
            onConfirm={handleDelete}
            onClosed={handleClosedModalDelete}
            toggleModal={() => setModalDelete(null)}
            isConfirmButtonLoading={showModalConfirmButtonLoading}
          />
        </RoleListWrapper>
      )}
    </>
  );
};

export default RoleListPage;
