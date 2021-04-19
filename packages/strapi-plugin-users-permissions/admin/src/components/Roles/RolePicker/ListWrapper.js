import React from 'react';
import styled from 'styled-components';
import { themePropTypes } from 'strapi-helper-plugin';
import { Text } from '@buffetjs/core';

const ListWrapper = styled(props => <Text as="ul" fontSize="md" {...props} />)`
  margin-bottom: 0;
  padding: 0;
  min-width: 230px;
  list-style-type: none;
  background-color: ${({ theme }) => theme.main.colors.white};
`;

ListWrapper.propTypes = {
  ...themePropTypes,
};

export default ListWrapper;
