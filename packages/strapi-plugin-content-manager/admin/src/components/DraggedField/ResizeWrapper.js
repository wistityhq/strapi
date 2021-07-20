/* eslint-disable */

import styled from 'styled-components';
import getColor from './utils/getColor';
import getBorderColor from "./utils/getBorderColor";

const ResizeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 0 0 30px;
  text-align: center;
  background-color: ${({ isOver, isSelected }) => getBorderColor(isOver, isSelected)};
  cursor: col-resize;
  
  svg {
    path {
      fill: ${({ isOver, isSelected }) => getColor(isOver, isSelected)};
    }
  }
`;

export default ResizeWrapper;
