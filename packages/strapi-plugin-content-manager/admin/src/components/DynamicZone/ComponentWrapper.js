import styled from 'styled-components';

const ComponentWrapper = styled.div`
  position: relative;
  > div {
    position: relative;
    box-shadow: 0 2px 4px #e3e9f3;
    border-radius: 2px;
    .arrow-icons {
      z-index: 9;
      .arrow-btn {
        display: inline-flex;
        svg {
          margin-left: 5px;
          margin-top: 5px;
        }
      }
    }
    &:not(:first-of-type) {
      margin-top: 32px;
      &:before {
        content: '&';
        position: absolute;
        top: -30px;
        left: 24.5px;
        height: 100%;
        width: 2px;
        background-color: #e6f0fb;
        color: transparent;
      }
    }
    > div:last-of-type {
      padding-top: 6px;
      padding-bottom: 5px;
      margin-bottom: 22px;
      border-radius: 2px;
    }
  }
`;

export default ComponentWrapper;
