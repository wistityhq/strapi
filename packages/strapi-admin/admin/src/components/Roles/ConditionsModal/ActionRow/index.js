import React from 'react';
import PropTypes from 'prop-types';
import { Text, Padded, Flex } from '@buffetjs/core';
import { useIntl } from 'react-intl';

import ConditionsSelect from '../ConditionsSelect';
import Wrapper from './Wrapper';

const ActionRow = ({
  arrayOfOptionsGroupedByCategory,
  isFormDisabled,
  isGrey,
  label,
  name,
  onCategoryChange,
  onChange,
  value,
}) => {
  const { formatMessage } = useIntl();

  return (
    <Wrapper isGrey={isGrey}>
      <Padded style={{ width: 200 }} top left right bottom size="sm">
        <Flex>
          <Text
            lineHeight="19px"
            color="grey"
            fontSize="xs"
            fontWeight="bold"
            textTransform="uppercase"
          >
            {formatMessage({
              id: 'Settings.permissions.conditions.can',
            })}
            &nbsp;
          </Text>
          <Text
            title={label}
            lineHeight="19px"
            fontWeight="bold"
            fontSize="xs"
            textTransform="uppercase"
            color="mediumBlue"
            style={{ maxWidth: '60%' }}
            ellipsis
          >
            {formatMessage({
              id: `Settings.roles.form.permissions.${label.toLowerCase()}`,
              defaultMessage: label,
            })}
          </Text>
          <Text
            lineHeight="19px"
            color="grey"
            fontSize="xs"
            fontWeight="bold"
            textTransform="uppercase"
          >
            &nbsp;
            {formatMessage({
              id: 'Settings.permissions.conditions.when',
            })}
          </Text>
        </Flex>
      </Padded>
      <ConditionsSelect
        arrayOfOptionsGroupedByCategory={arrayOfOptionsGroupedByCategory}
        name={name}
        isFormDisabled={isFormDisabled}
        onCategoryChange={onCategoryChange}
        onChange={onChange}
        value={value}
      />
    </Wrapper>
  );
};

ActionRow.propTypes = {
  arrayOfOptionsGroupedByCategory: PropTypes.array.isRequired,
  isFormDisabled: PropTypes.bool.isRequired,
  isGrey: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.object.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
};
export default ActionRow;
