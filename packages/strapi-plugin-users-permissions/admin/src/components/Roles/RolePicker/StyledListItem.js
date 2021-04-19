import styled from 'styled-components';
import PropTypes from 'prop-types';
import { themePropTypes } from 'strapi-helper-plugin';

/* eslint-disable indent */

const StyledListItem = styled.li`
  padding: 0 14px;
  height: 27px;
  &:hover {
    cursor: pointer;
    background-color: ${({ theme }) => theme.main.colors.mediumGrey};
  }
  ${({ isActive, theme }) =>
    isActive &&
    `
    background-color: ${theme.main.colors.mediumGrey};
  `}
`;

StyledListItem.defaultProps = {
  isActive: false,
};

StyledListItem.propTypes = {
  isActive: PropTypes.bool,
  ...themePropTypes,
};

export default StyledListItem;
