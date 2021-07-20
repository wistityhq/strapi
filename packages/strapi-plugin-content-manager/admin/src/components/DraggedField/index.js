import React, {forwardRef, useCallback, useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Grab, GrabLarge, Pencil } from '@buffetjs/icons';
import { CheckPermissions } from 'strapi-helper-plugin';
import pluginId from '../../pluginId';
import pluginPermissions from '../../permissions';
import useLayoutDnd from '../../hooks/useLayoutDnd';
import GrabWrapper from './GrabWrapper';
import Link from './Link';
import NameWrapper from './NameWrapper';
import RemoveWrapper from './RemoveWrapper';
import SubWrapper from './SubWrapper';
import Wrapper from './Wrapper';
import Close from './Close';
import ResizeWrapper from "./ResizeWrapper";
import useResize from "./utils/useResize";
import {OVER_EDIT, OVER_GRAB, OVER_REMOVE, OVER_RESIZE} from "./constants";

/* eslint-disable */
const DraggedField = forwardRef(
  (
    {
      children,
      count,
      goTo,
      componentUid,
      isDragging,
      isHidden,
      isSub,
      isResizeable,
      label,
      name,
      onClick,
      onRemove,
      onResize,
      selectedItem,
      size,
      style,
      type,
      withLongerHeight,
    },
    ref
  ) => {
    const { isDraggingSibling } = useLayoutDnd();

    const [isOver, setIsOver] = useState(null);
    const [columnWidth, setColumnWidth] = useState(0);

    const opacity = isDragging ? 0.2 : 1;
    const isSelected = selectedItem === name;
    const displayedLabel = isEmpty(label) ? name : label;

    const [triggerRef, resizedRef, width, , isResizing, initWidth] = useResize(2 * columnWidth, 12 * columnWidth);

    const handleOnResize = useCallback((width) => {
      const newSize = Math.ceil((width / columnWidth));

      if (newSize > 1 && newSize <= 12 && size !== newSize) {
        onResize((newSize - size));
      }
    }, [columnWidth, onResize, size]);

    useEffect(() => {
      // Calculate column width when resize starts
      if (initWidth) {
        setColumnWidth(initWidth / size);
      }
    }, [initWidth]);

    useEffect(() => {
      if (!onResize || !width) {
        return;
      }
      handleOnResize(width);
    }, [width]);

    return (
      <Wrapper
        count={count}
        onDrag={() => setIsOver(null)}
        style={style}
        isResizing={isResizing}
        withLongerHeight={withLongerHeight}
      >
        {!isHidden && (
          <SubWrapper
            className="sub_wrapper"
            isSelected={isSelected}
            isSub={isSub}
            isOver={isOver}
            style={{ opacity }}
            ref={resizedRef}
            withLongerHeight={withLongerHeight}
          >
            { !isSub &&
              <GrabWrapper
                className="grab"
                isSelected={isSelected}
                isOver={isOver}
                ref={ref}
                onMouseEnter={() => setIsOver(OVER_GRAB)}
                onMouseLeave={() => setIsOver(null)}
              >
                { withLongerHeight ? <GrabLarge /> : <Grab /> }
              </GrabWrapper>
            }
            <NameWrapper
              className="name"
              isSelected={isSelected}
              isOver={isOver}
              onClick={() => {
                onClick(name);
              }}
              onMouseEnter={() => {
                if (!isSub && !isDraggingSibling) {
                  setIsOver(OVER_EDIT);
                }
              }}
              onMouseLeave={() => {
                setIsOver(null);
              }}
            >
              {children ? (
                <>
                  <span>{displayedLabel}</span>
                  {children}
                </>
              ) : (
                <span>{displayedLabel}</span>
              )}
            </NameWrapper>
            {!isSub &&
              <RemoveWrapper
                className="remove"
                isSelected={isSelected}
                isOver={isOver}
                onClick={onRemove}
                onMouseEnter={() => setIsOver(OVER_REMOVE)}
                onMouseLeave={() => setIsOver(null)}
              >
                {(isOver === OVER_REMOVE && !isSelected) ? <Close/> : <Pencil/>}
              </RemoveWrapper>
            }
            {(!isSub && isResizeable) &&
              <ResizeWrapper
                className="resize"
                isSelected={isSelected}
                isOver={isOver}
                ref={triggerRef}
                onMouseEnter={() => setIsOver(OVER_RESIZE)}
                onMouseLeave={() => setIsOver(null)}
              >
                <FontAwesomeIcon icon="arrows-alt-h" />
              </ResizeWrapper>
            }
          </SubWrapper>
        )}
        {type === 'component' && (
          <CheckPermissions permissions={pluginPermissions.componentsConfigurations}>
            <FormattedMessage id={`${pluginId}.components.FieldItem.linkToComponentLayout`}>
              {msg => (
                <Link
                  onClick={e => {
                    e.stopPropagation();

                    goTo(`/plugins/${pluginId}/components/${componentUid}/configurations/edit`);
                  }}
                >
                  <FontAwesomeIcon icon="cog" />
                  {msg}
                </Link>
              )}
            </FormattedMessage>
          </CheckPermissions>
        )}
      </Wrapper>
    );
  }
);

DraggedField.defaultProps = {
  children: null,
  count: 1,
  goTo: () => {},
  componentUid: null,
  isDragging: false,
  isHidden: false,
  isSub: false,
  isResizeable: false,
  label: '',
  onClick: () => {},
  onRemove: () => {},
  onResize: null,
  selectedItem: '',
  size: null,
  shouldToggleDraggedFieldOverState: false,
  style: {},
  withLongerHeight: false,
};

DraggedField.propTypes = {
  children: PropTypes.node,
  count: PropTypes.number,
  goTo: PropTypes.func,
  componentUid: PropTypes.string,
  isDragging: PropTypes.bool,
  isHidden: PropTypes.bool,
  isSub: PropTypes.bool,
  isResizeable: PropTypes.bool,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  onRemove: PropTypes.func,
  onResize: PropTypes.func,
  selectedItem: PropTypes.string,
  size: PropTypes.number,
  style: PropTypes.object,
  type: PropTypes.string,
  withLongerHeight: PropTypes.bool,
};

DraggedField.displayName = 'DraggedField';

export default DraggedField;
