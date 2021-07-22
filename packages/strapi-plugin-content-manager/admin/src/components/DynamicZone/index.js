import React, { memo, useCallback, useMemo, useState } from 'react';
import { get } from 'lodash';
import isEqual from 'react-fast-compare';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import { Flex } from '@buffetjs/core';
import { LabelIconWrapper, NotAllowedInput } from 'strapi-helper-plugin';
import pluginId from '../../pluginId';
import connect from './utils/connect';
import select from './utils/select';
import BaselineAlignement from './BaselineAlignement';
import Button from './Button';
import Component from './Component';
import ComponentWrapper from './ComponentWrapper';
import DynamicZoneWrapper from './DynamicZoneWrapper';
import Label from './Label';
import Wrapper from './Wrapper';
import Picker from './Picker';

/* eslint-disable react/no-array-index-key */

const DynamicZone = ({
  name,
  // Passed with the select function
  addComponentToDynamicZone,
  formErrors,
  isCreatingEntry,
  isFieldAllowed,
  isFieldReadable,
  labelIcon,
  moveComponentUp,
  moveComponentDown,
  moveComponentTo,
  removeComponentFromDynamicZone,
  dynamicDisplayedComponents,
  fieldSchema,
  metadatas,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { formatMessage } = useIntl();
  // We cannot use the default props here
  const { max = Infinity, min = -Infinity } = fieldSchema;
  const dynamicZoneErrors = useMemo(() => {
    return Object.keys(formErrors)
      .filter(key => {
        return key === name;
      })
      .map(key => formErrors[key]);
  }, [formErrors, name]);

  const dynamicZoneAvailableComponents = useMemo(() => fieldSchema.components || [], [fieldSchema]);
  const dynamicDisplayedComponentsLength = dynamicDisplayedComponents.length;
  const missingComponentNumber = min - dynamicDisplayedComponentsLength;
  const hasError = dynamicZoneErrors.length > 0;
  const hasMinError =
    dynamicZoneErrors.length > 0 && get(dynamicZoneErrors, [0, 'id'], '').includes('min');

  const hasRequiredError = hasError && !hasMinError;
  const hasMaxError =
    hasError && get(dynamicZoneErrors, [0, 'id'], '') === 'components.Input.error.validation.max';

  const handleAddComponent = useCallback(
    componentUid => {
      setIsOpen(false);

      addComponentToDynamicZone(name, componentUid, hasError);
    },
    [addComponentToDynamicZone, hasError, name]
  );

  const handleClickOpenPicker = () => {
    if (dynamicDisplayedComponentsLength < max) {
      setIsOpen(prev => !prev);
    } else {
      strapi.notification.info(`${pluginId}.components.notification.info.maximum-requirement`);
    }
  };

  const formattedLabelIcon = labelIcon
    ? { icon: labelIcon.icon, title: formatMessage(labelIcon.title) }
    : null;

  if (!isFieldAllowed && isCreatingEntry) {
    return (
      <BaselineAlignement>
        <NotAllowedInput
          label={metadatas.label}
          spacerHeight="5px"
          labelIcon={formattedLabelIcon}
        />
      </BaselineAlignement>
    );
  }

  if (!isFieldAllowed && !isFieldReadable && !isCreatingEntry) {
    return (
      <BaselineAlignement>
        <NotAllowedInput
          label={metadatas.label}
          spacerHeight="5px"
          labelIcon={formattedLabelIcon}
        />
      </BaselineAlignement>
    );
  }

  return (
    <DynamicZoneWrapper>
      {dynamicDisplayedComponentsLength > 0 && (
        <Label>
          <Flex>
            <p>
              <span>{metadatas.label}</span>
            </p>
            {formattedLabelIcon && (
              <LabelIconWrapper title={formattedLabelIcon.title}>
                {formattedLabelIcon.icon}
              </LabelIconWrapper>
            )}
          </Flex>
          <p>{metadatas.description}</p>
        </Label>
      )}

      {/* List of displayed components */}
      <ComponentWrapper>
        {dynamicDisplayedComponents.map((componentUid, index) => {
          const showDownIcon =
            isFieldAllowed &&
            dynamicDisplayedComponentsLength > 0 &&
            index < dynamicDisplayedComponentsLength - 1;
          const showUpIcon = isFieldAllowed && dynamicDisplayedComponentsLength > 0 && index > 0;

          return (
            <Component
              componentUid={componentUid}
              key={index}
              index={index}
              isFieldAllowed={isFieldAllowed}
              moveComponentDown={moveComponentDown}
              moveComponentUp={moveComponentUp}
              moveComponentTo={moveComponentTo}
              name={name}
              removeComponentFromDynamicZone={removeComponentFromDynamicZone}
              addComponentToDynamicZone={handleAddComponent}
              showDownIcon={showDownIcon}
              showUpIcon={showUpIcon}
              availableComponentsList={dynamicZoneAvailableComponents}
            />
          );
        })}
      </ComponentWrapper>
      {isFieldAllowed ? (
        <Wrapper>
          <Button
            type="button"
            hasError={hasError}
            className={isOpen && 'isOpen'}
            onClick={handleClickOpenPicker}
          />
          {hasRequiredError && !isOpen && !hasMaxError && (
            <div className="error-label">
              <FormattedMessage id={`${pluginId}.components.DynamicZone.required`} />
            </div>
          )}
          {hasMaxError && !isOpen && (
            <div className="error-label">
              <FormattedMessage id="components.Input.error.validation.max" />
            </div>
          )}
          {hasMinError && !isOpen && (
            <div className="error-label">
              <FormattedMessage
                id={`${pluginId}.components.DynamicZone.missing${
                  missingComponentNumber > 1 ? '.plural' : '.singular'
                }`}
                values={{ count: missingComponentNumber }}
              />
            </div>
          )}
          <div className="info">
            <FormattedMessage
              id={`${pluginId}.components.DynamicZone.add-compo`}
              values={{ componentName: metadatas.label }}
            />
          </div>
          <Picker
            isOpen={isOpen}
            components={dynamicZoneAvailableComponents}
            onClickAddComponent={handleAddComponent}
          />
        </Wrapper>
      ) : (
        <BaselineAlignement top="9px" />
      )}
    </DynamicZoneWrapper>
  );
};

DynamicZone.defaultProps = {
  dynamicDisplayedComponents: [],
  fieldSchema: {
    max: Infinity,
    min: -Infinity,
  },
  labelIcon: null,
};

DynamicZone.propTypes = {
  addComponentToDynamicZone: PropTypes.func.isRequired,
  dynamicDisplayedComponents: PropTypes.array,
  fieldSchema: PropTypes.shape({
    components: PropTypes.array.isRequired,
    max: PropTypes.number,
    min: PropTypes.number,
  }),
  formErrors: PropTypes.object.isRequired,
  isCreatingEntry: PropTypes.bool.isRequired,
  isFieldAllowed: PropTypes.bool.isRequired,
  isFieldReadable: PropTypes.bool.isRequired,
  labelIcon: PropTypes.shape({
    icon: PropTypes.node.isRequired,
    title: PropTypes.shape({
      id: PropTypes.string.isRequired,
      defaultMessage: PropTypes.string.isRequired,
    }).isRequired,
  }),
  metadatas: PropTypes.shape({
    description: PropTypes.string,
    label: PropTypes.string,
  }).isRequired,
  moveComponentUp: PropTypes.func.isRequired,
  moveComponentDown: PropTypes.func.isRequired,
  moveComponentTo: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  removeComponentFromDynamicZone: PropTypes.func.isRequired,
};

const Memoized = memo(DynamicZone, isEqual);

export default connect(Memoized, select);

export { DynamicZone };
