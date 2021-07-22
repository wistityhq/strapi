import styled from 'styled-components';

/* eslint-disable */

const BannerWrapper = styled.button`
  display: grid;
  grid-template-columns: 35px 1fr 35px;
  grid-template-rows: 1fr;
  width: 100%;
  height: 45px;
  padding: 5px 15px;
  border: 1px solid
    ${({ hasErrors, isOpen, isReadOnly }) => {
      if (hasErrors) {
        return '#FFA784';
      } else if (isOpen && !isReadOnly) {
        return '#AED4FB';
      } else {
        return 'rgba(227, 233, 243, 0.75)';
      }
    }};

  ${({ doesPreviousFieldContainErrorsAndIsOpen }) => {
    if (doesPreviousFieldContainErrorsAndIsOpen) {
      return `
        border-top: 1px solid #ffa784;
      `;
    }
  }}

  ${({ isFirst }) => {
    if (isFirst) {
      return `
        border-top-right-radius: 2px;
        border-top-left-radius: 2px;
      `;
    }
  }}

  ${({ hasMinError, isFirst }) => {
    if (hasMinError) {
      return `
        border-color: #FAA684;
        border-top-color: ${isFirst ? '#FAA684' : 'rgba(227, 233, 243, 0.75)'};
        border-bottom-color: rgba(227, 233, 243, 0.75);
        `;
    }
  }}

  border-bottom: 0;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;

  background-color: ${({ hasErrors, isOpen, isReadOnly }) => {
    if (isReadOnly) {
      return '#fafafb';
    }

    if (hasErrors && isOpen) {
      return '#FFE9E0';
    } else if (isOpen) {
      return '#E6F0FB';
    } else {
      return '#ffffff';
    }
  }};

  ${({ hasErrors, isOpen, isReadOnly }) => {
    if (hasErrors) {
      return `
        color: #f64d0a;
        font-weight: 600;
      `;
    }

    if (isReadOnly) {
      return `
        color: #9EA7B8;
        font-weight: 600;
      `;
    }

    if (isOpen) {
      return `
        color: #007eff;
        font-weight: 600;
      `;
    }
  }}

  ${({ isOpen }) => {
    if (isOpen) {
      return `
        &.trash-icon {
          svg {
            path {
              fill: #007eff;
            }
          }
        }
      `;
    }
  }}

  &:focus {
    outline: 0;
  }


  .img-wrapper {
    width: 19px;
    height: 19px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: auto 0;
    border-radius: 50%;
    background-color: ${({ hasErrors, isOpen, isReadOnly }) => {
      if (hasErrors) {
        return '#FAA684';
      } else if (isOpen && !isReadOnly) {
        return '#AED4FB';
      } else {
        return '#F3F4F4';
      }
    }};
    text-align: center;

    ${({ isOpen }) => !isOpen && 'transform: rotate(180deg)'};
  }

  .cta-wrapper {
    display: flex;
    margin-left: auto;
    height: 100%;
    align-items:center;
    > button {
      padding: 0;
    }

    .trash-icon {
      svg {
        font-size: 10px;
        path {
          fill: #4B515A;
        }
      }
    }

    .grab {
      cursor: move;
      svg {
        vertical-align: initial;
      }
    }
  }

  ${({ hasErrors, isOpen, isReadOnly }) => {
    let fill = '#ABB3C2';
    let trashFill = '#4B515A';

    if (isOpen && !isReadOnly) {
      fill = '#007EFF';
      trashFill = '#007EFF';
    }

    if (hasErrors) {
      fill = '#F64D0A';
      trashFill = '#F64D0A';
    }

    return `
      svg {
        path {
          fill: ${fill} !important;
        }
      }
      .trash-icon {
        svg {
          path {
            fill: ${trashFill} !important;
          }
        }
      }
    `;
  }}

  -webkit-font-smoothing: antialiased;

  > div {
    align-self: start;
    text-align: start;
    margin-top: -2px;
    max-width:100%;
    margin: auto 0;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow:hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
  }
`;

BannerWrapper.defaultProps = {
  isReadOnly: false,
};

export default BannerWrapper;
