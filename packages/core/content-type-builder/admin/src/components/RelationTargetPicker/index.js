import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { get } from 'lodash';
import { Dropdown, DropdownToggle, DropdownMenu } from 'reactstrap';

import useDataManager from '../../hooks/useDataManager';
import Item from './Item';
import Wrapper from './Wrapper';

const RelationTargetPicker = ({ onChange, oneThatIsCreatingARelationWithAnother, target }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { contentTypes, sortedContentTypesList } = useDataManager();
  // TODO: replace with an obj { relation: 'x', bidirctional: true|false }
  const allowedContentTypesForRelation = useMemo(
    () =>
      sortedContentTypesList
        .filter(obj => obj.kind === 'collectionType')
        .filter(
          obj =>
            obj.restrictRelationsTo === null ||
            (Array.isArray(obj.restrictRelationsTo) && obj.restrictRelationsTo.length > 0)
        ),
    [sortedContentTypesList]
  );

  const pluginInfo = useMemo(() => {
    const plugin = get(contentTypes, [target, 'plugin'], null);

    if (plugin) {
      return (
        <span style={{ fontStyle: 'italic', textTransform: 'none' }}>&nbsp; (from: {plugin})</span>
      );
    }

    return null;
  }, [contentTypes, target]);

  const targetFriendlyName = useMemo(() => {
    const name = get(contentTypes, [target, 'schema', 'name'], 'error');

    return name;
  }, [contentTypes, target]);

  return (
    <Wrapper>
      <Dropdown
        isOpen={isOpen}
        toggle={() => {
          setIsOpen(!isOpen);
        }}
      >
        <DropdownToggle caret>
          <p>
            <FontAwesomeIcon
              icon={['far', 'caret-square-right']}
              style={{ fontSize: 12, marginTop: '-3px' }}
            />
            {targetFriendlyName}
            {pluginInfo}
          </p>
        </DropdownToggle>
        <DropdownMenu style={{ paddingTop: '3px' }}>
          {allowedContentTypesForRelation.map(({ uid, title, restrictRelationsTo, plugin }) => {
            return (
              <Item
                key={uid}
                uid={uid}
                title={title}
                restrictRelationsTo={restrictRelationsTo}
                plugin={plugin}
                onChange={onChange}
                oneThatIsCreatingARelationWithAnother={oneThatIsCreatingARelationWithAnother}
              />
            );
          })}
        </DropdownMenu>
      </Dropdown>
    </Wrapper>
  );
};

RelationTargetPicker.defaultProps = {
  onChange: () => {},
};

RelationTargetPicker.propTypes = {
  onChange: PropTypes.func,
  oneThatIsCreatingARelationWithAnother: PropTypes.string.isRequired,
  target: PropTypes.string.isRequired,
};

export default RelationTargetPicker;
