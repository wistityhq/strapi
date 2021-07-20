/* eslint-disable */

import styled, { css } from 'styled-components';
import PropTypes from 'prop-types';
import getHeight from './utils/getHeight';

const Wrapper = styled.div`
  ${({ withLongerHeight }) =>
    !withLongerHeight &&
    css`
      height: 30px;
    `};
  min-height: ${({ withLongerHeight }) => getHeight(withLongerHeight)};
  padding: 0 10px 0 0;
  flex-basis: calc(100% / ${props => props.count});
  flex-shrink: 1;
  min-width: 130px;
  position: relative;
  ${({ isResizing }) => isResizing && `
    border: 1px solid #ffcfcf;
    background: #ffe1e1;
  `}
  border-radius: 2px;
`;

Wrapper.defaultProps = {
  count: 1,
};

Wrapper.propTypes = {
  count: PropTypes.number,
};

export default Wrapper;
