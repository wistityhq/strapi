import styled from 'styled-components';

const ComponentWrapper = styled.div`
  position: relative;
  > div {
    position: relative;
    box-shadow: 0 2px 4px #e3e9f3;
    border-radius: 2px;
    .arrow-icons {
      position: absolute;
      top: -12px;
      right: 90px;
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
    .context-menu-dropdown {
      .btn {
        position: absolute;
        z-index: 100;
        top: -16px;
        right: 45px;
        transition: all 200ms ease-in;
        background-color: transparent;
        color: #333740;
        border: 0;
        &:hover {
          background-color: #f2f3f4;
        }
      }
      .dropdown-menu {
        font-size: 95%;
        background: #ffffff;
        border-radius: 2px;
        border-color: #ffffff;
        box-shadow: 0 2px 4px #e3e9f3;
        height: 400px;
        overflow-y: auto;

        .dropdown-header {
          font-size: 95%;
        }

        .dropdown-item {
          padding: 7px 20px;
          border-top: 1px solid #f6f6f6;

          svg {
            margin-right: 5px;
          }
        }
      }
    }
  }
`;

export default ComponentWrapper;
