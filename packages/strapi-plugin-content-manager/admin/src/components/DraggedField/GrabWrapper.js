/* eslint-disable */

import styled from 'styled-components';
import getColor from './utils/getColor';
import getBackgroundColor from "./utils/getBackgroundColor";

const GrabWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 0 0 30px;
  text-align: center;
  background-color: ${({ isOver, isSelected, isSub }) => getBackgroundColor(isOver, isSelected, isSub)};
  cursor: move;
  
  svg {
    margin: 0;
    
    g {
      fill: ${({ isOver, isSelected }) => getColor(isOver, isSelected)};
    }
  }
`;

export default GrabWrapper;
