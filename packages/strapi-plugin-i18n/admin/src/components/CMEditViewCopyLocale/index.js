import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Duplicate } from '@buffetjs/icons';
import { Label, Padded, Text } from '@buffetjs/core';
import Select from 'react-select';
import { useDispatch } from 'react-redux';
import { useTheme } from 'styled-components';
import { useIntl } from 'react-intl';
import {
  BaselineAlignment,
  DropdownIndicator,
  ModalConfirm,
  selectStyles,
  useContentManagerEditViewDataManager,
  request,
} from 'strapi-helper-plugin';
import { getTrad } from '../../utils';
import { cleanData, generateOptions } from './utils';

const CMEditViewCopyLocale = props => {
  if (!props.localizations.length) {
    return null;
  }

  return <Content {...props} />;
};

const Content = ({ appLocales, currentLocale, localizations, readPermissions }) => {
  const options = generateOptions(appLocales, currentLocale, localizations, readPermissions);

  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const { allLayoutData, slug } = useContentManagerEditViewDataManager();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(options[0]);
  const theme = useTheme();

  const handleConfirmCopyLocale = async () => {
    if (!value) {
      handleToggle();

      return;
    }

    const requestURL = `/content-manager/collection-types/${slug}/${value.value}`;

    try {
      setIsLoading(true);
      const response = await request(requestURL, { method: 'GET' });
      const cleanedData = cleanData(response, allLayoutData, localizations);

      dispatch({ type: 'ContentManager/CrudReducer/GET_DATA_SUCCEEDED', data: cleanedData });

      strapi.notification.toggle({
        type: 'success',
        message: {
          id: getTrad('CMEditViewCopyLocale.copy-success'),
          defaultMessage: 'Locale copied!',
        },
      });
    } catch (err) {
      console.error(err);

      strapi.notification.toggle({
        type: 'warning',
        message: {
          id: getTrad('CMEditViewCopyLocale.copy-failure'),
          defaultMessage: 'Failed to copy locale',
        },
      });
    } finally {
      setIsLoading(false);
      handleToggle();
    }
  };

  const handleChange = value => {
    setValue(value);
  };

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const styles = selectStyles(theme);

  return (
    <>
      <BaselineAlignment top size="12px" />
      <Text
        color="mediumBlue"
        fontWeight="semiBold"
        style={{ cursor: 'pointer' }}
        onClick={handleToggle}
      >
        <span style={{ marginRight: 10 }}>
          <Duplicate fill="#007EFF" />
        </span>
        {formatMessage({
          id: getTrad('CMEditViewCopyLocale.copy-text'),
          defaultMessage: 'Fill in from another locale',
        })}
      </Text>
      <ModalConfirm
        showButtonLoader={isLoading}
        confirmButtonLabel={{
          id: getTrad('CMEditViewCopyLocale.submit-text'),
          defaultMessage: 'Yes, fill in',
        }}
        content={{
          id: getTrad('CMEditViewCopyLocale.ModalConfirm.content'),
          defaultMessage:
            'Your current content will be erased and filled by the content of the selected locale:',
        }}
        isOpen={isOpen}
        onConfirm={handleConfirmCopyLocale}
        title={{
          id: getTrad('CMEditViewCopyLocale.ModalConfirm.title'),
          defaultMessage: 'Select Locale',
        }}
        toggle={handleToggle}
        type="success"
      >
        <Padded style={{ marginTop: -3 }} bottom size="sm">
          <span id="select-locale" style={{ textAlign: 'left' }}>
            <Label htmlFor="">
              {formatMessage({
                id: getTrad('Settings.locales.modal.locales.label'),
              })}
            </Label>
            <BaselineAlignment top size="3px" />
            <Select
              aria-labelledby="select-locale"
              components={{ DropdownIndicator }}
              isSearchable={false}
              defaultValue={options[0]}
              onChange={handleChange}
              options={options}
              styles={{
                ...styles,
                control: (base, state) => ({
                  ...base,
                  ...styles.control(base, state),
                  height: '34px',
                }),
                indicatorsContainer: (base, state) => ({
                  ...base,
                  ...styles.indicatorsContainer(base, state),
                  height: '32px',
                }),
                valueContainer: base => ({
                  ...base,
                  padding: '2px 0px 4px 10px',
                  lineHeight: '18px',
                }),
              }}
              value={value}
            />
          </span>
        </Padded>
      </ModalConfirm>
    </>
  );
};

CMEditViewCopyLocale.propTypes = {
  localizations: PropTypes.array.isRequired,
};

Content.propTypes = {
  appLocales: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      name: PropTypes.string,
    })
  ).isRequired,
  currentLocale: PropTypes.string.isRequired,
  localizations: PropTypes.array.isRequired,
  readPermissions: PropTypes.array.isRequired,
};

export default CMEditViewCopyLocale;
