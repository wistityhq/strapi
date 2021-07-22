import styled from 'styled-components';

/* eslint-disable indent */
const Wrapper = styled.div`
  position: relative;

  ${({ isFromDynamicZone }) => {
    if (isFromDynamicZone) {
      return `
        background-color: #fff;
      `;
    }

    return '';
  }}

  > p {
    width: 100%;
    font-size: 13px;
    line-height: normal;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export default Wrapper;
