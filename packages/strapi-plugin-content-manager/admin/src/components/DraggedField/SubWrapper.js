/* eslint-disable */

import styled from 'styled-components';
import PropTypes from 'prop-types';
import getHeight from './utils/getHeight';
import getBackgroundColor from "./utils/getBackgroundColor";
import getBorderColor from "./utils/getBorderColor";

const SubWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  min-height: ${({ withLongerHeight }) => getHeight(withLongerHeight)};
  ${({ withLongerHeight }) => (!withLongerHeight ? `height: 30px;` : ``)}
  line-height: ${({ withLongerHeight }) => getHeight(withLongerHeight)};

  background-color: ${({ isOver, isSelected, isSub }) => getBackgroundColor(isOver, isSelected, isSub)};
  border: 1px solid ${({ isOver, isSelected }) => getBorderColor(isOver, isSelected)};
  border-radius: 2px;
  
  & > * {
    border-right: 1px solid ${({ isOver, isSelected }) => getBorderColor(isOver, isSelected)};
    
    &:last-child {
      border: 0;    
    }
  }
  
  .grab,
  .remove,
  .resize {
    svg {
      align-self: center;
    }
  }
`;

SubWrapper.defaultProps = {
  isOver: null,
};

SubWrapper.propTypes = {
  isOver: PropTypes.string,
};

export default SubWrapper;
