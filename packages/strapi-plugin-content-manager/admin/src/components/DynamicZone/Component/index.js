import React, {memo, useMemo} from 'react';
import { Arrow } from '@buffetjs/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import isEqual from 'react-fast-compare';
import { useContentTypeLayout } from '../../../hooks';
import FieldComponent from '../../FieldComponent';
import RoundCTA from './RoundCTA';
import CTABar from "./CTABar";

const Component = ({
  componentUid,
  index,
  lastIndex,
  isFieldAllowed,
  moveComponent,
  expandComponent,
  isExpanded,
  name,
  removeComponentFromDynamicZone,
  showDownIcon,
  showUpIcon,
}) => {
  const { getComponentLayout } = useContentTypeLayout();
  const { icon, friendlyName } = useMemo(() => {
    const {
      info: { icon, name },
    } = getComponentLayout(componentUid);

    return { friendlyName: name, icon };
  }, [componentUid, getComponentLayout]);

  const handleMoveComponentDown = () => moveComponent(name, index, 1);
  const handleMoveComponentToBottom = () => moveComponent(name, index, lastIndex - index);

  const handleMoveComponentUp = () => moveComponent(name, index, -1);
  const handleMoveComponentToTop = () => moveComponent(name, index, index * (-1));

  const handleRemove = () => removeComponentFromDynamicZone(name, index);

  const handleExpandComponent = () => expandComponent(index);

  return (
    <div>
      <CTABar>
        <div className="arrow-icons">
          {showDownIcon && lastIndex > 1 && (
            <RoundCTA className="arrow-btn" onClick={handleMoveComponentToBottom} title="Move to bottom">
              <FontAwesomeIcon icon="level-up-alt" rotation="180" />
            </RoundCTA>
          )}
          {showDownIcon && (
            <RoundCTA className="arrow-btn arrow-down" onClick={handleMoveComponentDown} title="Move down">
              <Arrow />
            </RoundCTA>
          )}
          {showUpIcon && (
            <RoundCTA className="arrow-btn arrow-up" onClick={handleMoveComponentUp} title="Move up">
              <Arrow />
            </RoundCTA>
          )}
          {showUpIcon && lastIndex > 1 && (
            <RoundCTA className="arrow-btn" onClick={handleMoveComponentToTop} title="Move to top">
              <FontAwesomeIcon icon="level-up-alt" />
            </RoundCTA>
          )}
        </div>
        <RoundCTA onClick={handleExpandComponent}>
          <FontAwesomeIcon icon={isExpanded ? 'eye-slash' : 'eye'} />
        </RoundCTA>
        {isFieldAllowed && (
          <RoundCTA onClick={handleRemove}>
            <FontAwesomeIcon icon="trash-alt" />
          </RoundCTA>
        )}
      </CTABar>
      <FieldComponent
        componentUid={componentUid}
        componentFriendlyName={friendlyName}
        icon={icon}
        label=""
        name={`${name}.${index}`}
        isExpanded={isExpanded}
        isFromDynamicZone
      />
    </div>
  );
};

Component.defaultProps = {
  isExpanded: true,
}

Component.propTypes = {
  componentUid: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  lastIndex: PropTypes.number.isRequired,
  isFieldAllowed: PropTypes.bool.isRequired,
  moveComponent: PropTypes.func.isRequired,
  expandComponent: PropTypes.func.isRequired,
  isExpanded: PropTypes.bool,
  name: PropTypes.string.isRequired,
  removeComponentFromDynamicZone: PropTypes.func.isRequired,
  showDownIcon: PropTypes.bool.isRequired,
  showUpIcon: PropTypes.bool.isRequired,
};

export default memo(Component, isEqual);
