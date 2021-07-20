import React, { forwardRef, useState } from 'react';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import DraggedField from '../DraggedField';
import PreviewCarret from '../PreviewCarret';
import Carret from './Carret';
import DynamicZoneWrapper from './DynamicZoneWrapper';
import Wrapper from './Wrapper';
import DynamicComponent from './DynamicComponent';

/* eslint-disable react/no-array-index-key */

const DraggedFieldWithPreview = forwardRef(
  (
    {
      goTo,
      componentUid,
      componentLayouts,
      dynamicZoneComponents,
      isDragging,
      label,
      name,
      onClickEdit,
      onClickRemove,
      onResize,
      selectedItem,
      showLeftCarret,
      showRightCarret,
      size,
      style,
      type,
    },
    refs
  ) => {
    const isHidden = name === '_TEMP_';
    const [dragStart, setDragStart] = useState(false);
    const [isOverDynamicZone, setIsOverDynamicZone] = useState(false);
    const opacity = isDragging ? 0.2 : 1;
    const isFullSize = size === 12;
    const display = isFullSize && dragStart ? 'none' : '';
    const width = isFullSize && dragStart ? 0 : '100%';
    const higherFields = ['json', 'text', 'file', 'media', 'component', 'richtext', 'dynamiczone'];
    const withLongerHeight = higherFields.includes(type) && !dragStart;
    const getCompoInfos = uid => get(componentLayouts, [uid, 'info'], { name: '', icon: '' });

    const componentData = get(componentLayouts, [componentUid], {});
    const componentLayout = get(componentData, ['layouts', 'edit'], []);
    const getWrapperWidth = colNum => `${(1 / 12) * colNum * 100}%`;

    return (
      <div
        style={{ width: getWrapperWidth(size) }}
        onDrag={() => {
          if (isFullSize && !dragStart) {
            setDragStart(true);
          }
        }}
        onDragEnd={() => {
          if (isFullSize) {
            setDragStart(false);
          }
        }}
      >
        <Wrapper ref={refs.dropRef} withLongerHeight={withLongerHeight} style={style}>
          {dragStart && isFullSize && <PreviewCarret style={{ marginRight: '-10px' }} />}
          <>
            {showLeftCarret && <Carret />}

            <div className="sub" style={{ width, opacity }}>
              <DraggedField
                goTo={goTo}
                componentUid={componentUid}
                isHidden={isHidden}
                isOverDynamicZone={isOverDynamicZone}
                label={label}
                name={name}
                onClick={onClickEdit}
                onRemove={onClickRemove}
                onResize={onResize}
                size={size}
                isResizeable={type !== 'component' && type !== 'dynamiczone' && !!onResize}
                ref={refs.dragRef}
                selectedItem={selectedItem}
                style={{ display, marginRight: 0, paddingRight: 0 }}
                type={type}
                withLongerHeight={withLongerHeight}
              >
                {type === 'component' &&
                  componentLayout.map((row, i) => {
                    const marginBottom = i === componentLayout.length - 1 ? '29px' : '';
                    const marginTop = i === 0 ? '5px' : '';

                    return (
                      <div
                        style={{
                          display: 'flex',
                          marginBottom,
                          marginTop,
                        }}
                        key={i}
                      >
                        {row.map(field => {
                          const fieldType = get(
                            componentData,
                            ['attributes', field.name, 'type'],
                            ''
                          );
                          const label = get(
                            componentData,
                            ['metadatas', field.name, 'edit', 'label'],
                            ''
                          );

                          return (
                            <div
                              key={field.name}
                              style={{
                                width: getWrapperWidth(field.size),
                                marginBottom: '6px',
                              }}
                            >
                              <DraggedField
                                label={label}
                                name={field.name}
                                isSub
                                withLongerHeight={higherFields.includes(fieldType)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                {type === 'dynamiczone' && (
                  <DynamicZoneWrapper>
                    {dynamicZoneComponents.map(compo => {
                      const { name, icon } = getCompoInfos(compo);

                      return (
                        <DynamicComponent
                          key={compo}
                          componentUid={compo}
                          friendlyName={name}
                          icon={icon}
                          setIsOverDynamicZone={setIsOverDynamicZone}
                        />
                      );
                    })}
                  </DynamicZoneWrapper>
                )}
              </DraggedField>
            </div>
            {showRightCarret && <Carret right />}
          </>
        </Wrapper>
      </div>
    );
  }
);

DraggedFieldWithPreview.defaultProps = {
  goTo: () => {},
  componentLayouts: {},
  componentUid: null,
  dynamicZoneComponents: [],
  isDragging: false,
  label: '',
  onClickEdit: () => {},
  onClickRemove: () => {},
  onResize: null,
  selectedItem: '',
  showLeftCarret: false,
  showRightCarret: false,
  size: 1,
  style: {},
  type: 'string',
};

DraggedFieldWithPreview.propTypes = {
  goTo: PropTypes.func,
  componentLayouts: PropTypes.object,
  componentUid: PropTypes.string,
  dynamicZoneComponents: PropTypes.array,
  isDragging: PropTypes.bool,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  onClickEdit: PropTypes.func,
  onClickRemove: PropTypes.func,
  onResize: PropTypes.func,
  selectedItem: PropTypes.string,
  showLeftCarret: PropTypes.bool,
  showRightCarret: PropTypes.bool,
  size: PropTypes.number,
  style: PropTypes.object,
  type: PropTypes.string,
};

DraggedFieldWithPreview.displayName = 'DraggedFieldWithPreview';

export default DraggedFieldWithPreview;
