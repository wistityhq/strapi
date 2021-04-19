import React, {memo, useCallback, useMemo, useState} from 'react';
import { get } from 'lodash';
import isEqual from 'react-fast-compare';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { NotAllowedInput } from 'strapi-helper-plugin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
import DynamicZoneHeader from "./DynamicZoneHeader";
import Actions from "./Actions";

/* eslint-disable react/no-array-index-key */

const DynamicZone = ({
  name,
  // Passed with the select function
  addComponentToDynamicZone,
  formErrors,
  isCreatingEntry,
  isFieldAllowed,
  isFieldReadable,
  moveComponent,
  removeComponentFromDynamicZone,
  dynamicDisplayedComponents,
  fieldSchema,
  metadatas,
}) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const [componentsExpanded, setComponentsExpanded] = useState([]);

  const expandComponent = useCallback((index) => {
    const newComponentsExpanded = [...componentsExpanded];
    newComponentsExpanded[index] = !(componentsExpanded[index] ?? true);
    setComponentsExpanded(newComponentsExpanded);
  }, [componentsExpanded]);

  const allComponentsExpanded = useCallback(() => {
    return componentsExpanded.every((componentExpanded) => componentExpanded);
  }, [componentsExpanded]);

  const expandAllComponents = useCallback(() => {
    setComponentsExpanded(componentsExpanded.map(() => !allComponentsExpanded()));
  }, [componentsExpanded, allComponentsExpanded]);

  const handleMoveComponent = useCallback((name, index, offset) => {
    const newComponentsExpanded = [...componentsExpanded];
    newComponentsExpanded.splice(index + offset, 0, newComponentsExpanded.splice(index, 1)[0]);
    setComponentsExpanded(newComponentsExpanded);
    moveComponent(name, index, offset);
  }, [componentsExpanded, moveComponent]);

  const handleRemoveComponentFromDynamicZone = useCallback((name, index) => {
    const newComponentsExpanded = [...componentsExpanded];
    newComponentsExpanded.splice(index, 1);
    setComponentsExpanded(newComponentsExpanded);
    removeComponentFromDynamicZone(name, index);
  }, [componentsExpanded, removeComponentFromDynamicZone]);

  const handleAddComponent = useCallback(
    componentUid => {
      setIsOpen(false);
      setComponentsExpanded([...componentsExpanded, true]);
      addComponentToDynamicZone(name, componentUid, hasError);
    },
    [addComponentToDynamicZone, hasError, name, componentsExpanded]
  );

  const handleClickOpenPicker = () => {
    if (dynamicDisplayedComponentsLength < max) {
      setIsOpen(prev => !prev);
    } else {
      strapi.notification.info(`${pluginId}.components.notification.info.maximum-requirement`);
    }
  };

  if (!isFieldAllowed && isCreatingEntry) {
    return (
      <BaselineAlignement>
        <NotAllowedInput label={metadatas.label} spacerHeight="5px" />
      </BaselineAlignement>
    );
  }

  if (!isFieldAllowed && !isFieldReadable && !isCreatingEntry) {
    return (
      <BaselineAlignement>
        <NotAllowedInput label={metadatas.label} spacerHeight="5px" />
      </BaselineAlignement>
    );
  }

  return (
    <DynamicZoneWrapper>
      {dynamicDisplayedComponentsLength > 0 && (
        <DynamicZoneHeader>
          <Label>
            <p>{metadatas.label}</p>
            <p>{metadatas.description}</p>
          </Label>
          <Actions>
            <FontAwesomeIcon icon={allComponentsExpanded() ? 'eye-slash' : 'eye'} onClick={expandAllComponents} />
          </Actions>
        </DynamicZoneHeader>
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
              lastIndex={dynamicDisplayedComponentsLength - 1}
              isFieldAllowed={isFieldAllowed}
              moveComponent={handleMoveComponent}
              expandComponent={expandComponent}
              isExpanded={componentsExpanded[index]}
              name={name}
              removeComponentFromDynamicZone={handleRemoveComponentFromDynamicZone}
              showDownIcon={showDownIcon}
              showUpIcon={showUpIcon}
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
  metadatas: PropTypes.shape({
    description: PropTypes.string,
    label: PropTypes.string,
  }).isRequired,
  moveComponent: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  removeComponentFromDynamicZone: PropTypes.func.isRequired,
};

const Memoized = memo(DynamicZone, isEqual);

export default connect(Memoized, select);

export { DynamicZone };
