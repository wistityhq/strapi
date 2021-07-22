import getTrad from '../../../utils/getTrad';

const attributeOptions = {
  default: {
    autoFocus: true,
    name: 'default',
    type: 'text',
    label: {
      id: getTrad('form.attribute.settings.default'),
    },
    validations: {},
  },
  max: {
    autoFocus: false,
    name: 'max',
    type: 'customCheckboxWithChildren',
    label: {
      id: getTrad('form.attribute.item.maximum'),
    },
    validations: {},
  },
  maxLength: {
    autoFocus: false,
    name: 'maxLength',
    type: 'customCheckboxWithChildren',
    label: {
      id: getTrad('form.attribute.item.maximumLength'),
    },
    validations: {},
  },
  min: {
    autoFocus: false,
    name: 'min',
    type: 'customCheckboxWithChildren',
    label: {
      id: getTrad('form.attribute.item.minimum'),
    },
    validations: {},
  },
  minLength: {
    autoFocus: false,
    name: 'minLength',
    type: 'customCheckboxWithChildren',
    label: {
      id: getTrad('form.attribute.item.minimumLength'),
    },
    validations: {},
  },
  private: {
    autoFocus: false,
    name: 'private',
    type: 'checkbox',
    label: {
      id: getTrad('form.attribute.item.privateField'),
    },
    description: {
      id: getTrad('form.attribute.item.privateField.description'),
    },
    validations: {},
  },
  regex: {
    autoFocus: false,
    label: {
      id: getTrad('form.attribute.item.text.regex'),
    },
    name: 'regex',
    type: 'text',
    validations: {},
    description: {
      id: getTrad('form.attribute.item.text.regex.description'),
    },
  },
  required: {
    autoFocus: false,
    name: 'required',
    type: 'checkbox',
    label: {
      id: getTrad('form.attribute.item.requiredField'),
    },
    description: {
      id: getTrad('form.attribute.item.requiredField.description'),
    },
    validations: {},
  },
  unique: {
    autoFocus: false,
    name: 'unique',
    type: 'checkbox',
    label: {
      id: getTrad('form.attribute.item.uniqueField'),
    },
    description: {
      id: getTrad('form.attribute.item.uniqueField.description'),
    },
    validations: {},
  },
  expanded: {
    autoFocus: false,
    name: 'expanded',
    type: 'checkbox',
    label: {
      id: getTrad('form.attribute.item.expanded'),
    },
    description: {
      id: getTrad('form.attribute.item.expanded.description'),
    },
    validations: {},
  },
};

export default attributeOptions;
