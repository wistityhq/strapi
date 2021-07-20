import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { hasPermissions, useUser } from 'strapi-helper-plugin';
import pluginId from '../../pluginId';
import pluginPermissions from '../../permissions';
import DynamicComponentCard from '../DynamicComponentCard';

const DynamicComponent = ({ componentUid, friendlyName, icon }) => {
  const [{ isLoading, canAccess }, setState] = useState({ isLoading: true, canAccess: false });
  const { push } = useHistory();
  const { userPermissions } = useUser();

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const canAccess = await hasPermissions(
          userPermissions,
          pluginPermissions.componentsConfigurations
        );

        setState({ isLoading: false, canAccess });
      } catch (err) {
        setState({ isLoading: false });
      }
    };

    checkPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DynamicComponentCard
      componentUid={componentUid}
      friendlyName={friendlyName}
      icon={icon}
      onClick={() => {
        if (!isLoading && canAccess) {
          push(`/plugins/${pluginId}/components/${componentUid}/configurations/edit`);
        }
      }}
      tradId="components.DraggableAttr.edit"
    />
  );
};

DynamicComponent.defaultProps = {
  friendlyName: '',
  icon: 'smile',
};

DynamicComponent.propTypes = {
  componentUid: PropTypes.string.isRequired,
  friendlyName: PropTypes.string,
  icon: PropTypes.string,
};

export default DynamicComponent;
