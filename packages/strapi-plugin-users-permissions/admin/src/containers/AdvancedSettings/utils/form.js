import { getTrad } from '../../../utils';

const form = [
  {
    autoFocus: true,
    description: getTrad('EditForm.inputSelect.description.role'),
    label: getTrad('EditForm.inputSelect.label.role'),
    name: 'default_role',
    type: 'select',
    size: { xs: 6 },
    options: [],
  },
  {
    description: getTrad('EditForm.inputToggle.description.email'),
    label: getTrad('EditForm.inputToggle.label.email'),
    name: 'unique_email',
    type: 'bool',
    size: { xs: 12 },
  },
  {
    description: getTrad('EditForm.inputToggle.description.sign-up'),
    label: getTrad('EditForm.inputToggle.label.sign-up'),
    name: 'allow_register',
    type: 'bool',
    size: { xs: 12 },
  },
  {
    description: getTrad('EditForm.inputToggle.description.email-reset-password'),
    label: getTrad('EditForm.inputToggle.label.email-reset-password'),
    name: 'email_reset_password',
    type: 'text',
    size: { xs: 6 },
    placeholder: getTrad('EditForm.inputToggle.placeholder.email-reset-password'),
  },
  {
    description: getTrad('EditForm.inputToggle.description.email-confirmation'),
    label: getTrad('EditForm.inputToggle.label.email-confirmation'),
    name: 'email_confirmation',
    type: 'bool',
    size: { xs: 12 },
  },
  {
    description: getTrad('EditForm.inputToggle.description.email-confirmation-redirection'),
    label: getTrad('EditForm.inputToggle.label.email-confirmation-redirection'),
    name: 'email_confirmation_redirection',
    type: 'text',
    size: { xs: 6 },
    placeholder: getTrad('EditForm.inputToggle.placeholder.email-confirmation-redirection'),
  },
];

export default form;
