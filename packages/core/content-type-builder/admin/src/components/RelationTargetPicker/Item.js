import React, { memo } from 'react';
import { DropdownItem } from 'reactstrap';
import { useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import { Text } from '@buffetjs/core';
import { ON_CHANGE_RELATION_TARGET } from '../FormModal/constants';

const Item = ({
  oneThatIsCreatingARelationWithAnother,
  plugin,
  restrictRelationsTo,
  title,
  uid,
}) => {
  const dispatch = useDispatch();

  const handleChange = () => {
    const selectedContentTypeFriendlyName = plugin ? `${plugin}_${title}` : title;

    dispatch({
      type: ON_CHANGE_RELATION_TARGET,
      target: {
        value: uid,
        oneThatIsCreatingARelationWithAnother,
        selectedContentTypeFriendlyName,
        targetContentTypeAllowedRelations: restrictRelationsTo,
      },
    });
  };

  return (
    <DropdownItem key={uid} onClick={handleChange}>
      <p>
        <FontAwesomeIcon
          icon={['far', 'caret-square-right']}
          style={{ fontSize: 12, marginTop: '-3px' }}
        />
        {title}
        {plugin && (
          <Text as="span" fontStyle="italic" textTransform="none" color="rgba(50,55,64,0.75)">
            &nbsp; (from: {plugin})
          </Text>
        )}
      </p>
    </DropdownItem>
  );
};

Item.defaultProps = {
  plugin: null,
  restrictRelationsTo: null,
};

Item.propTypes = {
  oneThatIsCreatingARelationWithAnother: PropTypes.string.isRequired,
  plugin: PropTypes.string,
  restrictRelationsTo: PropTypes.array,
  title: PropTypes.string.isRequired,
  uid: PropTypes.string.isRequired,
};

export default memo(Item);
