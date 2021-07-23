import getTrad from '../../../utils/getTrad';

const nameField = {
  autoFocus: true,
  name: 'name',
  type: 'text',
  label: {
    id: getTrad('contentType.displayName.label'),
  },
  validations: {
    required: true,
  },
};

const forms = {
  advanced: {
    default: () => {
      return {
        items: [
          [
            {
              type: 'dividerDraftPublish',
            },
          ],
          [
            {
              label: {
                id: getTrad('contentType.draftAndPublish.label'),
              },
              description: {
                id: getTrad('contentType.draftAndPublish.description'),
              },
              name: 'draftAndPublish',
              type: 'bool',
              validations: {},
            },
          ],
          [{ type: 'divider' }],
        ],
      };
    },
  },
  base: {
    create: value => {
      return {
        items: [
          [
            nameField,
            {
              description: {
                id: getTrad('contentType.UID.description'),
              },
              label: 'UID',
              name: 'uid',
              type: 'text',
              readOnly: true,
              disabled: true,
              value,
            },
          ],
        ],
      };
    },
    edit: () => {
      return {
        items: [
          [
            nameField,
            {
              label: {
                id: getTrad('modalForm.attribute.text.type-selection'),
              },
              name: 'kind',
              type: 'booleanBox',
              size: 12,
              onChangeCallback: ({ toggleNotification }) =>
                toggleNotification({
                  type: 'info',
                  message: { id: getTrad('contentType.kind.change.warning') },
                }),
              options: [
                {
                  headerId: getTrad('menu.section.models.name.singular'),
                  descriptionId: getTrad('form.button.collection-type.description'),
                  value: 'collectionType',
                },
                {
                  headerId: getTrad('menu.section.single-types.name.singular'),
                  descriptionId: getTrad('form.button.single-type.description'),
                  value: 'singleType',
                },
              ],
              validations: {},
            },
          ],
        ],
      };
    },
  },
};

export default forms;
