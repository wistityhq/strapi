import styled from 'styled-components';

const Wrapper = styled.div`
  margin-bottom: ${({ hasError }) => (hasError ? '1.7rem' : '2.3rem')};

  > p {
    width: 100%;
    font-size: 13px;
    line-height: normal;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

Wrapper.defaultProps = {
  hasError: false,
};

export default Wrapper;
