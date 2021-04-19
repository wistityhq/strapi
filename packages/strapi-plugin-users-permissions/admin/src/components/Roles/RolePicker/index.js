import React from 'react';
import PropTypes from 'prop-types';
import { Picker } from '@buffetjs/core';
import { request } from 'strapi-helper-plugin';
import Button from './Button';
import List from './List';
import { useRolesList } from '../../../hooks';
import pluginId from '../../../pluginId';

const RolePicker = ({ onChange, value, label }) => {
  const { roles } = useRolesList(true);
  const handleChange = async ({ target: { value } }) => {
    try {
      const { role } = await request(`/${pluginId}/roles/${value}`, { method: 'GET' });
      onChange(role);
    } catch (err) {
      console.error(err);
      strapi.notification.toggle({
        type: 'warning',
        message: { id: 'notification.error' },
      });
    }
  };

  return (
    <Picker
      renderButtonContent={isOpen => <Button isOpen={isOpen} label={label} />}
      renderSectionContent={onToggle => (
        <List
          items={roles}
          selectedItem={value}
          onClick={async e => {
            await handleChange(e);
            onToggle();
          }}
        />
      )}
    />
  );
};

RolePicker.defaultProps = {
  onChange: () => {},
  value: '',
  label: '',
};

RolePicker.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.string,
  label: PropTypes.string,
};

export default RolePicker;
