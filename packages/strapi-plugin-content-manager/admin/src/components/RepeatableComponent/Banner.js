/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { forwardRef } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { Carret, Grab } from '@buffetjs/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import pluginId from '../../pluginId';
import PreviewCarret from '../PreviewCarret';
import BannerWrapper from './BannerWrapper';

/* eslint-disable jsx-a11y/no-static-element-interactions */

const Banner = forwardRef(
  (
    {
      displayedValue,
      doesPreviousFieldContainErrorsAndIsOpen,
      hasErrors,
      hasMinError,
      isFirst,
      isReadOnly,
      isDragging,
      isOpen,
      collapsable,
      onClickToggle,
      onClickRemove,
      style,
    },
    refs
  ) => {
    const display = isDragging ? 'none' : '';

    return (
      <BannerWrapper
        doesPreviousFieldContainErrorsAndIsOpen={doesPreviousFieldContainErrorsAndIsOpen}
        type="button"
        hasMinError={hasMinError}
        hasErrors={hasErrors}
        isFirst={isFirst}
        isOpen={isOpen}
        collapsable={collapsable}
        isReadOnly={isReadOnly}
        onClick={onClickToggle}
        ref={refs ? refs.dropRef : null}
        style={style}
      >
        {isDragging && collapsable && <PreviewCarret isComponent />}
        <>
          {collapsable && (
            <div className="img-wrapper" style={{ display }}>
              <Carret />
            </div>
          )}

          <FormattedMessage id={`${pluginId}.containers.Edit.pluginHeader.title.new`}>
            {msg => {
              // The displayed value may be "falsey" when the main field is a number or boolean
              return <div style={{ display }}>{displayedValue ?? msg}</div>;
            }}
          </FormattedMessage>
          <div className="cta-wrapper" style={{ display }}>
            {!isReadOnly && (
              <>
                <div
                  className="trash-icon"
                  style={{ marginRight: 10, padding: '0 5px' }}
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClickRemove();
                  }}
                >
                  <FontAwesomeIcon icon="trash-alt" />
                </div>
                <div className="grab" ref={refs ? refs.dragRef : null}>
                  <Grab />
                </div>
              </>
            )}
          </div>
        </>
      </BannerWrapper>
    );
  }
);

Banner.defaultProps = {
  displayedValue: null,
  doesPreviousFieldContainErrorsAndIsOpen: false,
  hasErrors: false,
  hasMinError: false,
  isDragging: false,
  isFirst: false,
  isOpen: false,
  collapsable: true,
  onClickRemove: () => {},
  onClickToggle: () => {},
  style: {},
};

Banner.propTypes = {
  displayedValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object]),
  doesPreviousFieldContainErrorsAndIsOpen: PropTypes.bool,
  hasErrors: PropTypes.bool,
  hasMinError: PropTypes.bool,
  isDragging: PropTypes.bool,
  isFirst: PropTypes.bool,
  isOpen: PropTypes.bool,
  collapsable: PropTypes.bool,
  isReadOnly: PropTypes.bool.isRequired,
  onClickToggle: PropTypes.func,
  onClickRemove: PropTypes.func,
  style: PropTypes.object,
};

Banner.displayName = 'Banner';

export default Banner;
