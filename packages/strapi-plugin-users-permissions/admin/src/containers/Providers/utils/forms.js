import * as yup from 'yup';
import { translatedErrors } from 'strapi-helper-plugin';

import { getTrad } from '../../../utils';

const forms = {
  email: {
    form: [
      {
        autoFocus: true,
        label: getTrad('PopUpForm.Providers.enabled.label'),
        name: 'enabled',
        type: 'bool',
        description: getTrad('PopUpForm.Providers.enabled.description'),
        size: { xs: 6 },
        validations: {
          required: true,
        },
      },
      {
        autoFocus: true,
        label: getTrad('PopUpForm.Providers.local.linkLogin.label'),
        name: 'linkLogin',
        type: 'bool',
        description: getTrad('PopUpForm.Providers.local.linkLogin.description'),
        size: { xs: 6 },
        validations: {
          required: true,
        },
      },
    ],
    schema: yup.object().shape({
      enabled: yup.bool().required(translatedErrors.required),
      linkLogin: yup.bool().when('enabled', {
        is: true,
        then: yup.bool().required(translatedErrors.required),
      }),
    }),
  },
  providers: {
    form: [
      {
        autoFocus: true,
        label: getTrad('PopUpForm.Providers.enabled.label'),
        name: 'enabled',
        type: 'bool',
        description: getTrad('PopUpForm.Providers.enabled.description'),
        size: { xs: 6 },
        validations: {
          required: true,
        },
      },
      {
        autoFocus: false,
        label: getTrad('PopUpForm.Providers.key.label'),
        name: 'key',
        type: 'text',
        placeholder: getTrad('PopUpForm.Providers.key.placeholder'),
        size: { xs: 12 },
        validations: {
          required: true,
        },
      },
      {
        autoFocus: false,
        label: getTrad('PopUpForm.Providers.secret.label'),
        name: 'secret',
        type: 'text',
        placeholder: getTrad('PopUpForm.Providers.secret.placeholder'),
        size: { xs: 12 },
        validations: {
          required: true,
        },
      },
      {
        autoFocus: false,
        label: getTrad('PopUpForm.Providers.redirectURL.front-end.label'),
        placeholder: 'http://www.client-app.com',
        name: 'callback',
        type: 'text',
        size: { xs: 12 },
        validations: {
          required: true,
        },
      },
      {
        label: {
          id: getTrad('PopUpForm.Providers.redirectURL.label'),
          params: {
            provider: 'VK',
          },
        },
        name: 'noName',
        type: 'text',
        validations: {},
        size: {
          xs: 12,
        },
        disabled: true,
      },
    ],
    schema: yup.object().shape({
      enabled: yup.bool().required(translatedErrors.required),
      key: yup.string().when('enabled', {
        is: true,
        then: yup.string().required(translatedErrors.required),
        otherwise: yup.string(),
      }),
      secret: yup.string().when('enabled', {
        is: true,
        then: yup.string().required(translatedErrors.required),
        otherwise: yup.string(),
      }),
      callback: yup.string().when('enabled', {
        is: true,
        then: yup.string().required(translatedErrors.required),
        otherwise: yup.string(),
      }),
    }),
  },
  providersWithSubdomain: {
    form: [
      {
        autoFocus: true,
        label: getTrad('PopUpForm.Providers.enabled.label'),
        name: 'enabled',
        type: 'bool',
        description: getTrad('PopUpForm.Providers.enabled.description'),
        size: { xs: 6 },
        validations: {
          required: true,
        },
      },
      {
        autoFocus: false,
        label: getTrad('PopUpForm.Providers.key.label'),
        name: 'key',
        type: 'text',
        placeholder: getTrad('PopUpForm.Providers.key.placeholder'),
        size: { xs: 12 },
        validations: {
          required: true,
        },
      },
      {
        autoFocus: false,
        label: getTrad('PopUpForm.Providers.secret.label'),
        name: 'secret',
        type: 'text',
        placeholder: getTrad('PopUpForm.Providers.secret.placeholder'),
        size: { xs: 12 },
        validations: {
          required: true,
        },
      },
      {
        autoFocus: false,
        label: getTrad('PopUpForm.Providers.subdomain.label'),
        name: 'subdomain',
        type: 'text',
        placeholder: getTrad('PopUpForm.Providers.subdomain.placeholder'),
        size: { xs: 12 },
        validations: {
          required: true,
        },
      },
      {
        autoFocus: false,
        label: getTrad('PopUpForm.Providers.redirectURL.front-end.label'),
        placeholder: 'http://www.client-app.com',
        name: 'callback',
        type: 'text',
        size: { xs: 12 },
        validations: {
          required: true,
        },
      },
      {
        label: {
          id: getTrad('PopUpForm.Providers.redirectURL.label'),
          params: {
            provider: 'VK',
          },
        },
        name: 'noName',
        type: 'text',
        validations: {},
        size: {
          xs: 12,
        },
        disabled: true,
      },
    ],
    schema: yup.object().shape({
      enabled: yup.bool().required(translatedErrors.required),
      key: yup.string().when('enabled', {
        is: true,
        then: yup.string().required(translatedErrors.required),
        otherwise: yup.string(),
      }),
      secret: yup.string().when('enabled', {
        is: true,
        then: yup.string().required(translatedErrors.required),
        otherwise: yup.string(),
      }),
      subdomain: yup.string().when('enabled', {
        is: true,
        then: yup.string().required(translatedErrors.required),
        otherwise: yup.string(),
      }),
      callback: yup.string().when('enabled', {
        is: true,
        then: yup.string().required(translatedErrors.required),
        otherwise: yup.string(),
      }),
    }),
  },
};

export default forms;
