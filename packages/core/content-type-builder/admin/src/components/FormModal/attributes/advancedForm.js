import React from 'react';
import { FormattedMessage } from 'react-intl';
import isEmpty from 'lodash/isEmpty';
import getTrad from '../../../utils/getTrad';
import { componentForm } from '../component';
import options from './attributeOptions';
import uiHelpers from './uiHelpers';

const advancedForm = {
  boolean: () => {
    return {
      items: [
        [
          {
            autoFocus: true,
            type: 'enum',
            label: {
              id: getTrad('form.attribute.settings.default'),
            },
            name: 'default',
            options: [
              { value: 'true', label: 'TRUE' },
              { value: '', label: 'NULL' },
              { value: 'false', label: 'FALSE' },
            ],
            validations: {},
          },
        ],
        [uiHelpers.divider],
        [options.required, options.unique],
        [options.private],
      ],
    };
  },
  component: ({ repeatable }, step) => {
    if (step === '1') {
      return { items: componentForm.advanced('componentToCreate') };
    }

    if (repeatable) {
      return {
        items: [
          [options.required, options.private],
          [uiHelpers.divider],
          [options.max, options.min],
        ],
      };
    }

    return {
      items: [[options.required, options.private]],
    };
  },
  date: ({ type }) => {
    return {
      items: [
        [
          {
            ...options.default,
            type: type || 'date',
            value: null,
            withDefaultValue: false,
            disabled: !type,
            autoFocus: false,
          },
        ],
        [uiHelpers.divider],
        [options.required, options.unique],
        [options.private],
      ],
    };
  },
  dynamiczone: () => {
    return {
      items: [[options.required], [uiHelpers.divider], [options.max, options.min]],
    };
  },
  email: () => {
    return {
      items: [
        [
          {
            ...options.default,
            type: 'email',
          },
        ],
        [uiHelpers.divider],
        [options.required, options.unique],
        [options.maxLength, options.minLength],
        [options.private],
      ],
    };
  },
  enumeration: data => {
    return {
      items: [
        [
          {
            autoFocus: false,
            name: 'default',
            type: 'select',
            label: {
              id: getTrad('form.attribute.settings.default'),
            },
            validations: {},
            options: [
              <FormattedMessage
                key="hidden___value__placeholder"
                id="components.InputSelect.option.placeholder"
              >
                {msg => <option value="">{msg}</option>}
              </FormattedMessage>,
            ].concat(
              data.enum
                ? data.enum
                    .filter((val, index) => data.enum.indexOf(val) === index && !isEmpty(val))
                    .map(val => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))
                : []
            ),
          },
          {
            label: {
              id: getTrad('form.attribute.item.enumeration.graphql'),
            },
            name: 'enumName',
            type: 'text',
            validations: {},
            description: {
              id: getTrad('form.attribute.item.enumeration.graphql.description'),
            },
          },
        ],
        [uiHelpers.divider],
        [options.required, options.unique],
        [options.private],
      ],
    };
  },
  json: () => {
    return {
      items: [[uiHelpers.divider], [options.required, options.unique], [options.private]],
    };
  },
  media: () => {
    return {
      items: [
        [uiHelpers.divider],
        [options.required, options.unique],
        [
          {
            label: {
              id: getTrad('form.attribute.media.allowed-types'),
            },
            name: 'allowedTypes',
            type: 'allowedTypesSelect',
            value: '',
            validations: {},
          },
        ],
        [options.private],
      ],
    };
  },
  number: data => {
    const inputStep = data.type === 'decimal' || data.type === 'float' ? 'any' : '1';

    return {
      items: [
        [
          {
            autoFocus: true,
            name: 'default',
            type: data.type === 'biginteger' ? 'text' : 'number',
            step: inputStep,
            label: {
              id: getTrad('form.attribute.settings.default'),
            },
            validations: {},
          },
        ],
        [uiHelpers.divider],
        [options.required, options.unique],
        [options.max, options.min],
        [options.private],
      ],
    };
  },
  password: () => {
    return {
      items: [
        [options.default],
        [uiHelpers.divider],
        [options.required, options.unique],
        [options.maxLength, options.minLength],
        [options.private],
      ],
    };
  },
  relation: () => {
    return {
      items: [[uiHelpers.divider], [options.private]],
    };
  },
  richtext: () => {
    return {
      items: [
        [options.default],
        [uiHelpers.divider],
        [options.required, options.unique],
        [options.maxLength, options.minLength],
        [options.private],
      ],
    };
  },
  text: () => {
    return {
      items: [
        [options.default, options.regex],
        [uiHelpers.divider],
        [options.required, options.unique],
        [options.maxLength, options.minLength],
        [options.private],
      ],
    };
  },
  uid: data => {
    return {
      items: [
        [{ ...options.default, disabled: Boolean(data.targetField), type: 'text' }],
        [uiHelpers.divider],
        [options.required],
        [options.maxLength, options.minLength],
        [options.private],
      ],
    };
  },
};

export default advancedForm;
