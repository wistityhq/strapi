import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { useIntl } from 'react-intl';
import { upperFirst } from 'lodash';
import MenuList from './MenuList';
import getTrad from '../../utils/getTrad';

const AllowedTypesSelect = ({ name, changeMediaAllowedTypes, styles, value }) => {
  const { formatMessage } = useIntl();
  // Create a ref in order to access the StateManager
  // So we can close the menu after clicking on a menu item
  // This allows us to get rid of the menuIsOpen state management
  // So we let the custom components taking care of it
  const ref = useRef();

  /* eslint-disable indent */

  const displayedValue =
    value === null || value.length === 0
      ? formatMessage({ id: getTrad('form.attribute.media.allowed-types.none') })
      : [...value]
          .sort()
          .map(v => upperFirst(v))
          .join(', ');

  /* eslint-enable indent */

  return (
    <Select
      components={{ MenuList }}
      isClearable={false}
      isSearchable={false}
      name={name}
      changeMediaAllowedTypes={changeMediaAllowedTypes}
      ref={ref}
      refState={ref}
      styles={styles}
      value={{ label: displayedValue, value: value || '' }}
    />
  );
};

AllowedTypesSelect.defaultProps = {
  value: null,
};

AllowedTypesSelect.propTypes = {
  changeMediaAllowedTypes: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  styles: PropTypes.object.isRequired,
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

export default AllowedTypesSelect;
