import styled from 'styled-components';

const SorterWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const DragHandle = styled.div`
  outline: none;
  text-decoration: none;
  margin-top: -1px;
  padding: 10px;
  cursor: move;

  > span {
    vertical-align: middle;
    position: relative;
    display: inline-block;
    width: 6px;
    height: 1px;
    padding: 0px;
    background: #b3b5b9;
    overflow: visible;
    transition: background 0.25s ease-out;

    &:before,
    &:after {
      content: '';
      display: inline-block;
      width: 6px;
      height: 1px;
      background: inherit;
    }

    &:before {
      position: absolute;
      top: -2px;
      left: 0;
    }

    &:after {
      position: absolute;
      bottom: -2px;
      left: 0;
    }
  }
`;

export { DragHandle, SorterWrapper };
