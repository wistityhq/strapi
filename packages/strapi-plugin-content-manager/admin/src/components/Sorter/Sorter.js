import React from 'react';
import PropTypes from 'prop-types';

import { DragHandle, SorterWrapper } from './Styles';

const Sorter = ({ drag }) => {
  return (
    <SorterWrapper ref={drag}>
      <DragHandle className="dragHandle">
        <span />
      </DragHandle>
    </SorterWrapper>
  );
};

Sorter.propTypes = {
  drag: PropTypes.func.isRequired,
};

export default Sorter;
