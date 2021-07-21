import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Flex, Text } from '@buffetjs/core';
import styled from 'styled-components';
// Those styles are very specific.
// so it is not a big problem to use custom paddings and widths.
const HeaderLabel = styled.div`
  width: 12rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
`;
const PropertyLabelWrapper = styled.div`
  width: 18rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
  padding-left: 3.5rem;
`;

const Header = ({ headers, label }) => {
  const { formatMessage } = useIntl();
  const translatedLabel = formatMessage(
    {
      id: 'Settings.roles.form.permission.property-label',
      defaultMessage: '{label} permissions',
    },
    { label }
  );

  return (
    <Flex>
      <PropertyLabelWrapper>
        <Text fontWeight="bold">{translatedLabel}</Text>
      </PropertyLabelWrapper>
      {headers.map(header => {
        if (!header.isActionRelatedToCurrentProperty) {
          return <HeaderLabel key={header.label} />;
        }

        return (
          <HeaderLabel key={header.label}>
            <Text textTransform="capitalize" fontWeight="bold">
              {formatMessage({
                id: `Settings.roles.form.permissions.${header.label.toLowerCase()}`,
                defaultMessage: header.label,
              })}
            </Text>
          </HeaderLabel>
        );
      })}
    </Flex>
  );
};

Header.propTypes = {
  headers: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      isActionRelatedToCurrentProperty: PropTypes.bool.isRequired,
    })
  ).isRequired,
  label: PropTypes.string.isRequired,
};

export default Header;
