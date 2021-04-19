import styled from 'styled-components';
import PropTypes from 'prop-types';

const RoundCTA = styled.div.attrs(({title}) => ({
  title,
}))`
  height: 31px;
  width: 31px;
  border-radius: 50%;
  background-color: #f2f3f4;
  border: 2px solid #ffffff;
  cursor: pointer;
  display: flex;
  z-index: 9;
  svg {
    font-size: 10px;
    line-height: 29px;
    margin: auto;
  }
  &:not(.arrow-btn) {
    transition: all 200ms ease-in;
    &:hover {
      background-color: #faa684;
      color: #f64d0a;
    }
  }
  &.arrow-btn {
    height: 22px;
    width: 22px;
    background-color: #ffffff;
    border: 2px solid #ffffff;
    svg {
      font-size: 10px;
      line-height: 22px;
    }
    &:hover {
      background-color: #f2f3f4;
    }
    &.arrow-down {
      transform: rotate(180deg);
    }
  }
`;

RoundCTA.propTypes = {
  title: PropTypes.string,
};

export default RoundCTA;
