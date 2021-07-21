import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalFooter, TabPanel, useGlobalContext } from 'strapi-helper-plugin';
import { useIntl } from 'react-intl';
import { Button } from '@buffetjs/core';
import { Formik } from 'formik';
import localeFormSchema from '../../schemas';
import useEditLocale from '../../hooks/useEditLocale';
import { getTrad } from '../../utils';
import BaseForm from './BaseForm';
import AdvancedForm from './AdvancedForm';
import SettingsModal from '../SettingsModal';

const ModalEdit = ({ localeToEdit, onClose, locales }) => {
  const { isEditing, editLocale } = useEditLocale();
  const shouldUpdateMenu = useRef(false);
  const { updateMenu } = useGlobalContext();
  const { formatMessage } = useIntl();
  const isOpened = Boolean(localeToEdit);

  const handleSubmit = ({ displayName, isDefault }) => {
    const id = localeToEdit.id;
    const name = displayName || localeToEdit.code;

    return editLocale(id, { name, isDefault })
      .then(() => {
        shouldUpdateMenu.current = true;
      })
      .then(onClose);
  };

  const handleClose = () => {
    if (shouldUpdateMenu.current) {
      updateMenu();
    }

    shouldUpdateMenu.current = false;
  };

  let options = [];
  let defaultOption;

  if (localeToEdit) {
    options = locales.map(locale => ({ label: locale.code, value: locale.id }));
    defaultOption = options.find(option => option.value === localeToEdit.id);
  }

  return (
    <Modal isOpen={isOpened} onToggle={onClose} onClosed={handleClose}>
      <Formik
        initialValues={{
          displayName: localeToEdit ? localeToEdit.name : '',
          isDefault: localeToEdit ? localeToEdit.isDefault : false,
        }}
        onSubmit={handleSubmit}
        validationSchema={localeFormSchema}
      >
        {({ handleSubmit, errors }) => (
          <form onSubmit={handleSubmit}>
            <SettingsModal
              title={formatMessage({
                id: getTrad('Settings.locales.modal.title'),
              })}
              breadCrumb={[getTrad('Settings.list.actions.edit')]}
              tabsAriaLabel={formatMessage({
                id: getTrad('Settings.locales.modal.edit.tab.label'),
              })}
              tabsId="i18n-settings-tabs-edit"
            >
              <TabPanel>
                <BaseForm options={options} defaultOption={defaultOption} />
              </TabPanel>
              <TabPanel>
                <AdvancedForm isDefaultLocale={Boolean(localeToEdit && localeToEdit.isDefault)} />
              </TabPanel>
            </SettingsModal>

            <ModalFooter>
              <section>
                <Button type="button" color="cancel" onClick={onClose}>
                  {formatMessage({ id: 'app.components.Button.cancel' })}
                </Button>
                <Button
                  color="success"
                  type="submit"
                  isLoading={isEditing}
                  disabled={Object.keys(errors).length > 0}
                >
                  {formatMessage({ id: getTrad('Settings.locales.modal.edit.confirmation') })}
                </Button>
              </section>
            </ModalFooter>
          </form>
        )}
      </Formik>
    </Modal>
  );
};

ModalEdit.defaultProps = {
  localeToEdit: undefined,
  locales: [],
};

ModalEdit.propTypes = {
  localeToEdit: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    isDefault: PropTypes.bool.isRequired,
  }),
  onClose: PropTypes.func.isRequired,
  locales: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      code: PropTypes.string,
    })
  ),
};

export default ModalEdit;
