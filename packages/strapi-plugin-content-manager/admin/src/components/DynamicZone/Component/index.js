import React, { memo, useMemo, useState } from 'react';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { Arrow } from '@buffetjs/icons';
import { groupBy } from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import isEqual from 'react-fast-compare';
import { useContentTypeLayout } from '../../../hooks';
import FieldComponent from '../../FieldComponent';
import RoundCTA from './RoundCTA';

const Component = ({
  componentUid,
  index,
  isFieldAllowed,
  moveComponentDown,
  moveComponentUp,
  moveComponentTo,
  name,
  removeComponentFromDynamicZone,
  addComponentToDynamicZone,
  showDownIcon,
  showUpIcon,
  availableComponentsList,
}) => {
  const { getComponentLayout } = useContentTypeLayout();
  const { icon, friendlyName } = useMemo(() => {
    const {
      info: { icon, name },
    } = getComponentLayout(componentUid);

    return { friendlyName: name, icon };
  }, [componentUid, getComponentLayout]);

  const handleMoveComponentDown = () => moveComponentDown(name, index);

  const handleMoveComponentUp = () => moveComponentUp(name, index);

  const handleRemove = () => removeComponentFromDynamicZone(name, index);

  const handleAddComponentToDynamicZone = component => {
    addComponentToDynamicZone(component);
    moveComponentTo(name, index);
  };

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggle = () => setDropdownOpen(prevState => !prevState);

  const dynamicComponentCategories = useMemo(() => {
    const componentsWithInfo = availableComponentsList.map(componentUid => {
      const { category, info } = getComponentLayout(componentUid);

      return { componentUid, category, info };
    });

    const categories = groupBy(componentsWithInfo, 'category');

    return Object.keys(categories).reduce((acc, current) => {
      acc.push({ category: current, components: categories[current] });

      return acc;
    }, []);
  }, [availableComponentsList, getComponentLayout]);

  return (
    <div>
      <div className="arrow-icons">
        {showDownIcon && (
          <RoundCTA className="arrow-btn arrow-down" onClick={handleMoveComponentDown}>
            <Arrow />
          </RoundCTA>
        )}
        {showUpIcon && (
          <RoundCTA className="arrow-btn arrow-up" onClick={handleMoveComponentUp}>
            <Arrow />
          </RoundCTA>
        )}
      </div>
      <Dropdown isOpen={dropdownOpen} toggle={toggle} className="context-menu-dropdown">
        <DropdownToggle>
          <RoundCTA>
            <FontAwesomeIcon icon="plus" />
          </RoundCTA>
        </DropdownToggle>
        <DropdownMenu>
          {dynamicComponentCategories.map(category => (
            <div key={category.category}>
              <DropdownItem header>{category.category}</DropdownItem>
              {category.components.map(component => (
                <DropdownItem
                  key={component.componentUid}
                  onClick={() => handleAddComponentToDynamicZone(component.componentUid)}
                >
                  <FontAwesomeIcon icon={component.info.icon} /> {component.info.name}
                </DropdownItem>
              ))}
            </div>
          ))}
        </DropdownMenu>
      </Dropdown>
      {isFieldAllowed && (
        <RoundCTA className="remove-btn" onClick={handleRemove}>
          <FontAwesomeIcon icon="trash-alt" />
        </RoundCTA>
      )}
      <FieldComponent
        componentUid={componentUid}
        componentFriendlyName={friendlyName}
        icon={icon}
        label=""
        name={`${name}.${index}`}
        isFromDynamicZone
      />
    </div>
  );
};

Component.propTypes = {
  componentUid: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  isFieldAllowed: PropTypes.bool.isRequired,
  moveComponentDown: PropTypes.func.isRequired,
  moveComponentUp: PropTypes.func.isRequired,
  moveComponentTo: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  removeComponentFromDynamicZone: PropTypes.func.isRequired,
  addComponentToDynamicZone: PropTypes.func.isRequired,
  showDownIcon: PropTypes.bool.isRequired,
  showUpIcon: PropTypes.bool.isRequired,
  availableComponentsList: PropTypes.array.isRequired,
};

export default memo(Component, isEqual);
