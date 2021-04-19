import React from 'react';
import PropTypes from 'prop-types';
import ListItem from './ListItem';
import ListWrapper from './ListWrapper';

const RoleList = ({ onClick, items, selectedItem }) => {
  return (
    <ListWrapper>
      {items.map(item => {
        return (
          <ListItem
            key={item.id}
            label={item.name}
            value={item.id}
            onClick={onClick}
            selectedItem={selectedItem}
          />
        );
      })}
    </ListWrapper>
  );
};

RoleList.defaultProps = {
  onClick: () => {},
  items: [],
  selectedItem: null,
};

RoleList.propTypes = {
  onClick: PropTypes.func,
  items: PropTypes.array,
  selectedItem: PropTypes.string,
};

export default RoleList;
