/* eslint-disable import/no-cycle */
import React, { memo, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Collapse } from 'reactstrap';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import ItemTypes from '../../../utils/ItemTypes';
import Inputs from '../../Inputs';
import FieldComponent from '../../FieldComponent';
import Banner from '../Banner';
import FormWrapper from '../FormWrapper';
import { connect, select } from './utils';

/* eslint-disable react/no-array-index-key */

// Issues:
// https://github.com/react-dnd/react-dnd/issues/1368
// https://github.com/frontend-collective/react-sortable-tree/issues/490

const DraggedItem = ({
  componentFieldName,
  doesPreviousFieldContainErrorsAndIsOpen,
  hasErrors,
  hasMinError,
  isFirst,
  isReadOnly,
  isOpen,
  collapsable,
  onClickToggle,
  schema,
  toggleCollapses,
  // Retrieved from the select function
  moveComponentField,
  removeRepeatableField,
  triggerFormValidation,
  checkFormErrors,
  displayedValue,
}) => {
  const dragRef = useRef(null);
  const dropRef = useRef(null);
  const [showForm, setShowForm] = useState(false);

  const fields = schema.layouts.edit;

  useEffect(() => {
    if (isOpen) {
      setShowForm(true);
    }
  }, [isOpen]);

  const [, drop] = useDrop({
    accept: ItemTypes.COMPONENT,
    canDrop() {
      return false;
    },
    hover(item, monitor) {
      if (!dropRef.current) {
        return;
      }

      const dragPath = item.originalPath;
      const hoverPath = componentFieldName;
      const fullPathToComponentArray = dragPath.split('.');
      const dragIndexString = fullPathToComponentArray
        .slice()
        .splice(-1)
        .join('');
      const hoverIndexString = hoverPath
        .split('.')
        .splice(-1)
        .join('');
      const pathToComponentArray = fullPathToComponentArray.slice(
        0,
        fullPathToComponentArray.length - 1
      );
      const dragIndex = parseInt(dragIndexString, 10);
      const hoverIndex = parseInt(hoverIndexString, 10);

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = dropRef.current.getBoundingClientRect();
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      // Time to actually perform the action in the data
      moveComponentField(pathToComponentArray, dragIndex, hoverIndex);

      item.originalPath = hoverPath;
    },
  });
  const [{ isDragging }, drag, preview] = useDrag({
    item: {
      type: ItemTypes.COMPONENT,
      displayedValue,
      originalPath: componentFieldName,
    },
    begin: () => {
      // Close all collapses
      toggleCollapses(-1);
    },
    end: () => {
      // Update the errors
      triggerFormValidation();
    },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: false });
  }, [preview]);

  // Create the refs
  // We need 1 for the drop target
  // 1 for the drag target
  const refs = {
    dragRef: drag(dragRef),
    dropRef: drop(dropRef),
  };

  return (
    <>
      <Banner
        componentFieldName={componentFieldName}
        hasErrors={hasErrors}
        hasMinError={hasMinError}
        isFirst={isFirst}
        displayedValue={displayedValue}
        doesPreviousFieldContainErrorsAndIsOpen={doesPreviousFieldContainErrorsAndIsOpen}
        isDragging={isDragging}
        isOpen={isOpen}
        collapsable={collapsable}
        isReadOnly={isReadOnly}
        onClickToggle={onClickToggle}
        onClickRemove={() => {
          removeRepeatableField(componentFieldName);
          toggleCollapses();
        }}
        ref={refs}
      />
      <Collapse
        isOpen={isOpen}
        style={{ backgroundColor: '#FAFAFB' }}
        onExited={() => setShowForm(false)}
      >
        {!isDragging && (
          <FormWrapper
            hasErrors={hasErrors}
            isOpen={isOpen}
            isReadOnly={isReadOnly}
            collapsable={collapsable}
          >
            {showForm &&
              fields.map((fieldRow, key) => {
                return (
                  <div className="row" key={key}>
                    {fieldRow.map(({ name, fieldSchema, metadatas, queryInfos, size }) => {
                      const isComponent = fieldSchema.type === 'component';
                      const keys = `${componentFieldName}.${name}`;

                      if (isComponent) {
                        const componentUid = fieldSchema.component;

                        return (
                          <FieldComponent
                            componentUid={componentUid}
                            isRepeatable={fieldSchema.repeatable}
                            key={name}
                            label={metadatas.label}
                            isNested
                            name={keys}
                            max={fieldSchema.max}
                            min={fieldSchema.min}
                            collapsable={!fieldSchema.expanded}
                          />
                        );
                      }

                      return (
                        <div key={name} className={`col-${size}`}>
                          <Inputs
                            autoFocus={false}
                            fieldSchema={fieldSchema}
                            keys={keys}
                            metadatas={metadatas}
                            onBlur={hasErrors ? checkFormErrors : null}
                            queryInfos={queryInfos}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
          </FormWrapper>
        )}
      </Collapse>
    </>
  );
};

DraggedItem.defaultProps = {
  doesPreviousFieldContainErrorsAndIsOpen: false,
  hasErrors: false,
  hasMinError: false,
  isFirst: false,
  isOpen: false,
  collapsable: true,
  toggleCollapses: () => {},
};

DraggedItem.propTypes = {
  componentFieldName: PropTypes.string.isRequired,
  doesPreviousFieldContainErrorsAndIsOpen: PropTypes.bool,
  hasErrors: PropTypes.bool,
  hasMinError: PropTypes.bool,
  isFirst: PropTypes.bool,
  isOpen: PropTypes.bool,
  collapsable: PropTypes.bool,
  isReadOnly: PropTypes.bool.isRequired,
  onClickToggle: PropTypes.func.isRequired,
  schema: PropTypes.object.isRequired,
  toggleCollapses: PropTypes.func,
  moveComponentField: PropTypes.func.isRequired,
  removeRepeatableField: PropTypes.func.isRequired,
  triggerFormValidation: PropTypes.func.isRequired,
  checkFormErrors: PropTypes.func.isRequired,
  displayedValue: PropTypes.string.isRequired,
};

const Memoized = memo(DraggedItem);

export default connect(Memoized, select);

export { DraggedItem };
