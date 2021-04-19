import styled from 'styled-components';

const ExpandComponent = styled.div`
  ${({ isExpanded }) =>
  !isExpanded &&
  `
    overflow: hidden;
    max-height: 100px;
    &:after {
      display: block;
      content: '';
      background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(230,230,230,1) 100%);
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 15px;
    }
  `}
`;

ExpandComponent.defaultProps = {
  isExpanded: true,
};

export default ExpandComponent;
