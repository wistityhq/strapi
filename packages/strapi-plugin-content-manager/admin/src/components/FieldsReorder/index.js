import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';

import useLayoutDnd from '../../hooks/useLayoutDnd';

import Add from '../AddDropdown';
import SortWrapper from '../SortWrapper';
import Wrapper from './components';
import Item from './Item';

const FieldsReorder = ({ className }) => {
  const {
    attributes,
    buttonData,
    layout,
    moveItem,
    moveRow,
    onAddData,
    removeField,
    resizeItem,
  } = useLayoutDnd();

  const getComponent = useCallback(
    attributeName => {
      return get(attributes, [attributeName, 'component'], '');
    },
    [attributes]
  );
  const getType = useCallback(
    attributeName => {
      const attribute = get(attributes, [attributeName], {});

      return attribute.type;
    },
    [attributes]
  );
  const getDynamicZoneComponents = useCallback(
    attributeName => {
      const attribute = get(attributes, [attributeName], {});

      return attribute.components || [];
    },
    [attributes]
  );

  return (
    <div className={className}>
      <SortWrapper
        style={{
          marginTop: 7,
          paddingTop: 11,
          paddingLeft: 5,
          paddingRight: 5,
          border: '1px dashed #e3e9f3',
        }}
      >
        {layout.map((row, rowIndex) => {
          return (
            <Wrapper key={row.rowId} style={{}}>
              {row.rowContent.map((rowContent, index) => {
                const { name, size } = rowContent;

                return (
                  <Item
                    componentUid={getComponent(name)}
                    dynamicZoneComponents={getDynamicZoneComponents(name)}
                    itemIndex={index}
                    key={name}
                    moveRow={moveRow}
                    moveItem={moveItem}
                    resizeItem={resizeItem}
                    name={name}
                    removeField={removeField}
                    rowIndex={rowIndex}
                    size={size}
                    type={getType(name)}
                  />
                );
              })}
            </Wrapper>
          );
        })}
        <Wrapper style={{ marginBottom: 10 }}>
          <Add
            data={buttonData}
            onClick={onAddData}
            style={{ width: '100%', margin: '0 5px' }}
          />
        </Wrapper>
      </SortWrapper>
    </div>
  );
};

FieldsReorder.defaultProps = {
  className: 'col-8',
};

FieldsReorder.propTypes = {
  className: PropTypes.string,
};

export default memo(FieldsReorder);
