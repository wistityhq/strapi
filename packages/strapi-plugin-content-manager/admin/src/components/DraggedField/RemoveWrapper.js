import styled from 'styled-components';
import getBorderColor from "./utils/getBorderColor";
import getColor from "./utils/getColor";

/* eslint-disable indent */
const RemoveWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 0 0 30px;
  text-align: center;
  background-color: ${({ isOver, isSelected }) => getBorderColor(isOver, isSelected)};
  cursor: pointer;
  
  svg {
    align-self: center;
    color: #b4b6ba;
    
    path {
      fill: ${({ isOver, isSelected }) => getColor(isOver, isSelected)};
    }
  }
`;

export default RemoveWrapper;
