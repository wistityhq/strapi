import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { get, isEmpty } from 'lodash';
import {
  CheckPermissions,
  LabelIconWrapper,
  prefixFileUrlWithBackendUrl,
} from 'strapi-helper-plugin';
import { Description } from '@buffetjs/styles';
import pluginPermissions from '../../permissions';
import { getTrad, formatFileForEditing } from '../../utils';
import CardControl from '../CardControl';
import CardControlWrapper from './CardControlWrapper';
import CardPreviewWrapper from './CardPreviewWrapper';
import EmptyInputMedia from './EmptyInputMedia';
import EmptyText from './EmptyText';
import InputFilePreview from './InputFilePreview';
import InputModalStepper from '../../containers/InputModalStepper';
import Name from './Name';
import Wrapper from './Wrapper';
import Input from '../Input';
import ErrorMessage from './ErrorMessage';

const InputMedia = ({
  disabled,
  label,
  description,
  onChange,
  name,
  attribute,
  value,
  type,
  id,
  error,
  labelIcon,
}) => {
  const [modal, setModal] = useState({
    isOpen: false,
    step: 'list',
    fileToEdit: null,
    isDisplayed: false,
  });
  const [fileToDisplay, setFileToDisplay] = useState(0);
  const hasNoValue = !!value && Array.isArray(value) && value.length === 0;
  const currentFile = attribute.multiple ? value[fileToDisplay] : value;
  const fileURL = get(currentFile, ['url'], null);
  const prefixedFileURL = fileURL ? prefixFileUrlWithBackendUrl(fileURL) : null;
  const displaySlidePagination =
    attribute.multiple && value.length > 1 ? ` (${fileToDisplay + 1}/${value.length})` : '';
  const inputId = id || name;
  const errorId = `error-${inputId}`;

  useEffect(() => {
    setFileToDisplay(0);
  }, [modal.isOpen]);

  const handleClickToggleModal = () => {
    if (!disabled) {
      setModal(prev => ({
        isDisplayed: true,
        step: 'list',
        isOpen: !prev.isOpen,
        fileToEdit: null,
      }));
    }
  };

  const handleClosed = () => setModal(prev => ({ ...prev, isDisplayed: false }));

  const handleChange = v => {
    onChange({ target: { name, type, value: v } });
  };

  const handleFilesNavigation = displayNext => {
    if (attribute.multiple) {
      if (displayNext && fileToDisplay === value.length - 1) {
        setFileToDisplay(0);

        return;
      }

      if (!displayNext && fileToDisplay === 0) {
        setFileToDisplay(value.length - 1);
      } else {
        setFileToDisplay(prev => (displayNext ? prev + 1 : prev - 1));
      }
    }
  };

  const handleRemoveFile = () => {
    const newValue = attribute.multiple
      ? value.filter((file, index) => index !== fileToDisplay)
      : null;

    if (Array.isArray(newValue) && fileToDisplay === newValue.length) {
      setFileToDisplay(fileToDisplay > 0 ? fileToDisplay - 1 : fileToDisplay);
    }

    handleChange(newValue);
  };

  const handleEditFile = () => {
    setModal(() => ({
      isDisplayed: true,
      isOpen: true,
      step: 'edit',
      fileToEdit: formatFileForEditing(currentFile),
    }));
  };

  const handleCopy = () => {
    strapi.notification.toggle({
      type: 'info',
      message: { id: 'notification.link-copied' },
    });
  };

  const handleAllowDrop = e => e.preventDefault();

  const handleDrop = e => {
    e.preventDefault();
    e.persist();

    if (e.dataTransfer) {
      setModal(() => ({
        isDisplayed: true,
        isOpen: true,
        step: 'upload',
        filesToUpload: e.dataTransfer.files,
      }));
    }
  };

  return (
    <Wrapper hasError={!isEmpty(error)}>
      <Name htmlFor={name}>
        <span>{`${label}${displaySlidePagination}`}</span>
        {labelIcon && <LabelIconWrapper title={labelIcon.title}>{labelIcon.icon}</LabelIconWrapper>}
      </Name>
      {!!description && <Description>{description}</Description>}
      <CardPreviewWrapper onDragOver={handleAllowDrop} onDrop={handleDrop}>
        <CardControlWrapper>
          {!disabled && (
            <CardControl
              small
              title="add"
              color="#9EA7B8"
              type="plus"
              onClick={handleClickToggleModal}
            />
          )}
          {!hasNoValue && !disabled && (
            <>
              <CheckPermissions permissions={pluginPermissions.update}>
                <CardControl
                  small
                  title="edit"
                  color="#9EA7B8"
                  type="pencil"
                  onClick={handleEditFile}
                />
              </CheckPermissions>
              <CheckPermissions permissions={pluginPermissions.copyLink}>
                <CopyToClipboard onCopy={handleCopy} text={prefixedFileURL}>
                  <CardControl small title="copy-link" color="#9EA7B8" type="link" />
                </CopyToClipboard>
              </CheckPermissions>
              <CardControl
                small
                title="delete"
                color="#9EA7B8"
                type="trash-alt"
                onClick={handleRemoveFile}
              />
            </>
          )}
        </CardControlWrapper>
        {hasNoValue ? (
          <EmptyInputMedia onClick={handleClickToggleModal} disabled={disabled}>
            <EmptyText id={getTrad('input.placeholder')} />
          </EmptyInputMedia>
        ) : (
          <InputFilePreview
            isSlider={attribute.multiple && value.length > 1}
            file={currentFile}
            onClick={handleFilesNavigation}
          />
        )}
        <Input type="file" name={name} />
      </CardPreviewWrapper>
      {modal.isDisplayed && (
        <InputModalStepper
          isOpen={modal.isOpen}
          onClosed={handleClosed}
          step={modal.step}
          fileToEdit={modal.fileToEdit}
          filesToUpload={modal.filesToUpload}
          multiple={attribute.multiple}
          onInputMediaChange={handleChange}
          selectedFiles={value}
          onToggle={handleClickToggleModal}
          allowedTypes={attribute.allowedTypes}
        />
      )}
      {error && <ErrorMessage id={errorId}>{error}</ErrorMessage>}
    </Wrapper>
  );
};

InputMedia.propTypes = {
  attribute: PropTypes.shape({
    allowedTypes: PropTypes.arrayOf(PropTypes.string),
    multiple: PropTypes.bool,
    required: PropTypes.bool,
    type: PropTypes.string,
  }).isRequired,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  id: PropTypes.string,
  label: PropTypes.string,
  labelIcon: PropTypes.shape({
    icon: PropTypes.node.isRequired,
    title: PropTypes.string,
  }),
  description: PropTypes.string,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};
InputMedia.defaultProps = {
  disabled: false,
  id: null,
  error: null,
  label: '',
  labelIcon: null,
  description: '',
  value: null,
};

export default InputMedia;
