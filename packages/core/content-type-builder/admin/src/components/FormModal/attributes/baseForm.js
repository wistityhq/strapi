import React, { Fragment } from 'react';
import { FormattedMessage } from 'react-intl';
import getTrad from '../../../utils/getTrad';
import { componentField, componentForm } from '../component';
import { nameField } from './nameField';
import uiHelpers from './uiHelpers';

const baseForm = {
  component: (data, step) => {
    if (step === '1') {
      const itemsToConcat =
        data.createComponent === true
          ? [[uiHelpers.spacer]].concat(componentForm.base('componentToCreate.'))
          : [[uiHelpers.spacer]];

      return {
        items: [[componentField], ...itemsToConcat],
      };
    }

    return {
      items: [
        [
          nameField,
          {
            name: 'component',
            type: 'componentSelect',
            label: {
              id: getTrad('modalForm.attributes.select-component'),
            },
            isMultiple: false,
          },
        ],
        [
          {
            label: {
              id: getTrad('modalForm.attribute.text.type-selection'),
            },
            name: 'repeatable',
            type: 'booleanBox',
            size: 12,
            options: [
              {
                headerId: getTrad('form.attribute.component.option.repeatable'),
                descriptionId: getTrad('form.attribute.component.option.repeatable.description'),
                value: true,
              },
              {
                headerId: getTrad('form.attribute.component.option.single'),
                descriptionId: getTrad('form.attribute.component.option.single.description'),
                value: false,
              },
            ],
            validations: {},
          },
        ],
        [uiHelpers.spacer],
      ],
    };
  },
  date: () => {
    return {
      items: [
        [
          nameField,
          {
            label: {
              id: getTrad('modalForm.attribute.text.type-selection'),
            },
            name: 'type',
            type: 'select',
            options: [
              { id: 'components.InputSelect.option.placeholder', value: '' },
              {
                id: 'form.attribute.item.date.type.date',
                value: 'date',
              },
              {
                id: 'form.attribute.item.date.type.datetime',
                value: 'datetime',
              },
              // Not sure the ctm supports that one
              // {
              //   id: 'form.attribute.item.date.type.timestamp',
              //   value: 'timestamp',
              // },
              { id: 'form.attribute.item.date.type.time', value: 'time' },
            ].map(({ id, value }, index) => {
              const disabled = index === 0;
              const tradId = index === 0 ? id : getTrad(id);

              return (
                <FormattedMessage id={tradId} key={id}>
                  {msg => (
                    <option disabled={disabled} hidden={disabled} value={value}>
                      {msg}
                    </option>
                  )}
                </FormattedMessage>
              );
            }),
            validations: {
              required: true,
            },
          },
        ],
      ],
    };
  },
  enumeration: () => {
    return {
      items: [
        [nameField],
        [
          {
            autoFocus: false,
            name: 'enum',
            type: 'textarea',
            size: 8,
            label: {
              id: getTrad('form.attribute.item.enumeration.rules'),
            },
            placeholder: {
              id: getTrad('form.attribute.item.enumeration.placeholder'),
            },
            validations: {
              required: true,
            },
          },
        ],
      ],
    };
  },
  media: () => {
    return {
      items: [
        [nameField],
        [
          {
            label: { id: getTrad('modalForm.attribute.text.type-selection') },
            name: 'multiple',
            size: 12,
            type: 'booleanBox',
            options: [
              {
                headerId: getTrad('form.attribute.media.option.multiple'),
                descriptionId: getTrad('form.attribute.media.option.multiple.description'),
                value: true,
              },
              {
                headerId: getTrad('form.attribute.media.option.single'),
                descriptionId: getTrad('form.attribute.media.option.single.description'),
                value: false,
              },
            ],
            validations: {},
          },
        ],
        [uiHelpers.spacerMedium],
      ],
    };
  },
  number: () => {
    return {
      items: [
        [
          nameField,
          {
            label: {
              id: getTrad('form.attribute.item.number.type'),
            },
            name: 'type',
            type: 'select',
            options: [
              { id: 'components.InputSelect.option.placeholder', value: '' },
              {
                id: 'form.attribute.item.number.type.integer',
                value: 'integer',
              },
              {
                id: 'form.attribute.item.number.type.biginteger',
                value: 'biginteger',
              },
              {
                id: 'form.attribute.item.number.type.decimal',
                value: 'decimal',
              },
              { id: 'form.attribute.item.number.type.float', value: 'float' },
            ].map(({ id, value }, index) => {
              const disabled = index === 0;
              const tradId = index === 0 ? id : getTrad(id);

              return (
                <FormattedMessage id={tradId} key={id}>
                  {msg => (
                    <option disabled={disabled} hidden={disabled} value={value}>
                      {msg}
                    </option>
                  )}
                </FormattedMessage>
              );
            }),
            validations: {
              required: true,
            },
          },
        ],
      ],
    };
  },
  relation: () => {
    return {
      items: [
        [
          {
            type: 'relation',
          },
        ],
      ],
    };
  },
  string: () => {
    return {
      items: [
        [nameField],
        [
          {
            label: { id: getTrad('modalForm.attribute.text.type-selection') },
            name: 'type',
            size: 12,
            type: 'booleanBox',
            options: [
              {
                headerId: getTrad('form.attribute.text.option.short-text'),
                descriptionId: getTrad('form.attribute.text.option.short-text.description'),
                value: 'string',
              },
              {
                headerId: getTrad('form.attribute.text.option.long-text'),
                descriptionId: getTrad('form.attribute.text.option.long-text.description'),
                value: 'text',
              },
            ],
            validations: {},
          },
        ],
        [uiHelpers.spacerMedium],
      ],
    };
  },
  text: () => {
    return {
      items: [
        [nameField],
        [
          {
            label: { id: getTrad('modalForm.attribute.text.type-selection') },
            name: 'type',
            size: 12,
            type: 'booleanBox',
            options: [
              {
                headerId: getTrad('form.attribute.text.option.short-text'),
                descriptionId: getTrad('form.attribute.text.option.short-text.description'),
                value: 'string',
              },
              {
                headerId: getTrad('form.attribute.text.option.long-text'),
                descriptionId: getTrad('form.attribute.text.option.long-text.description'),
                value: 'text',
              },
            ],
            validations: {},
          },
        ],
        [uiHelpers.spacerMedium],
      ],
    };
  },
  uid: (data, step, attributes) => {
    const options = attributes
      .filter(({ type }) => ['string', 'text'].includes(type))
      .map(({ name }) => ({ id: name, value: name }));

    return {
      items: [
        [
          {
            ...nameField,
            placeholder: {
              id: getTrad('modalForm.attribute.form.base.name.placeholder'),
            },
          },
          {
            label: {
              id: getTrad('modalForm.attribute.target-field'),
            },
            name: 'targetField',
            type: 'select',
            options: [{ id: getTrad('none'), value: '' }, ...options].map((option, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <Fragment key={index}>
                {index === 0 ? (
                  <FormattedMessage id={option.id}>
                    {msg => <option value={option.value}>{msg}</option>}
                  </FormattedMessage>
                ) : (
                  <option value={option.value}>{option.value}</option>
                )}
              </Fragment>
            )),
            validations: {
              required: true,
            },
          },
        ],
      ],
    };
  },
};

export default baseForm;
