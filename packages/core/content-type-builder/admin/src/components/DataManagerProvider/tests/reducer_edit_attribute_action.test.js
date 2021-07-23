import reducer, { initialState } from '../reducer';
import { EDIT_ATTRIBUTE } from '../constants';

describe('CTB | components | DataManagerProvider | reducer | EDIT_ATTRIBUTE', () => {
  describe('Editing a common attribute (string, integer, json, media, ...)', () => {
    it('Should edit the attribute correctly and preserve the order of the attributes for a content type', () => {
      const contentTypeUID = 'application::address.address';
      const contentType = {
        uid: contentTypeUID,
        schema: {
          name: 'address',
          description: '',
          connection: 'default',
          collectionName: '',
          attributes: [
            { name: 'geolocation', type: 'json', required: true },
            { name: 'cover', type: 'media', multiple: false, required: false },
            {
              name: 'category',
              relation: 'oneToOne',
              target: 'application::category.category',
              type: 'relation',
            },
          ],
        },
      };

      const state = {
        ...initialState,
        contentTypes: { [contentTypeUID]: contentType },
        initialContentTypes: { [contentTypeUID]: contentType },
        modifiedData: {
          components: {},
          contentType,
        },
      };

      const action = {
        type: EDIT_ATTRIBUTE,
        attributeToSet: {
          type: 'media',
          multiple: true,
          required: false,
          name: 'covers',
        },
        forTarget: 'contentType',
        targetUid: contentTypeUID,
        initialAttribute: {
          type: 'media',
          multiple: false,
          required: false,
          name: 'cover',
        },
        shouldAddComponentToData: false,
      };

      const expected = {
        ...initialState,
        contentTypes: { [contentTypeUID]: contentType },
        initialContentTypes: { [contentTypeUID]: contentType },
        modifiedData: {
          components: {},
          contentType: {
            ...contentType,
            schema: {
              ...contentType.schema,
              attributes: [
                { name: 'geolocation', type: 'json', required: true },
                { name: 'covers', type: 'media', multiple: true, required: false },
                {
                  name: 'category',
                  relation: 'oneToOne',
                  target: 'application::category.category',
                  type: 'relation',
                },
              ],
            },
          },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should edit the attribute correctly and preserve the order of the attributes for a component inside the content type view', () => {
      const contentTypeUID = 'application::address.address';
      const componentUID = 'default.dish';
      const contentType = {
        uid: contentTypeUID,
        schema: {
          name: 'address',
          description: '',
          connection: 'default',
          collectionName: '',
          attributes: [
            {
              name: 'dishes',
              component: componentUID,
              type: 'component',
              repeatable: true,
            },
            {
              name: 'category',
              relation: 'oneToOne',
              target: 'application::category.category',
              type: 'relation',
            },
          ],
        },
      };
      const component = {
        uid: componentUID,
        category: 'default',
        schema: {
          icon: 'book',
          name: 'dish',
          description: '',
          connection: 'default',
          collectionName: 'components_dishes',
          attributes: [
            {
              name: 'name',
              type: 'string',
              required: true,
              default: 'My super dish',
            },
            {
              name: 'description',
              type: 'text',
            },
            {
              name: 'price',
              type: 'float',
            },
          ],
        },
      };

      const state = {
        ...initialState,
        components: { [componentUID]: component },
        initialComponents: { [componentUID]: component },
        contentTypes: { [contentTypeUID]: contentType },
        initialContentTypes: { [contentTypeUID]: contentType },
        modifiedData: {
          components: { [componentUID]: component },
          contentType,
        },
      };

      const action = {
        type: EDIT_ATTRIBUTE,
        attributeToSet: {
          type: 'text',
          required: true,
          name: 'test',
        },
        forTarget: 'components',
        targetUid: componentUID,
        initialAttribute: {
          type: 'text',
          name: 'description',
        },
        shouldAddComponentToData: false,
      };

      const expected = {
        ...initialState,
        components: { [componentUID]: component },
        initialComponents: { [componentUID]: component },
        contentTypes: { [contentTypeUID]: contentType },
        initialContentTypes: { [contentTypeUID]: contentType },
        modifiedData: {
          components: {
            [componentUID]: {
              ...component,
              schema: {
                ...component.schema,
                attributes: [
                  {
                    name: 'name',
                    type: 'string',
                    required: true,
                    default: 'My super dish',
                  },
                  {
                    name: 'test',
                    type: 'text',
                    required: true,
                  },
                  {
                    name: 'price',
                    type: 'float',
                  },
                ],
              },
            },
          },
          contentType,
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });
  });

  describe('Editing a relation attribute', () => {
    describe('Editing a relation with the same content type', () => {
      describe('Changing the nature of the relation', () => {
        it('Should handle changing the nature from a one side relation (oneWay or manyWay) to another one side relation correctly and preserve the order of the attributes', () => {
          const contentTypeUID = 'application::address.address';
          const contentType = {
            uid: contentTypeUID,
            schema: {
              name: 'address',
              description: '',
              connection: 'default',
              collectionName: '',
              attributes: [
                { name: 'geolocation', type: 'json', required: true },
                { name: 'city', type: 'string', required: true },
                { name: 'postal_code', type: 'string' },
                {
                  name: 'one_way',
                  relation: 'oneToOne',
                  targetAttribute: null,
                  target: contentTypeUID,
                  type: 'relation',
                },
                {
                  name: 'category',
                  relation: 'oneToOne',
                  target: 'application::category.category',
                  targetAttribute: null,
                  type: 'relation',
                },
                {
                  name: 'cover',
                  type: 'media',
                  multiple: false,
                  required: false,
                },
                {
                  name: 'images',
                  type: 'media',
                  multiple: true,
                  required: false,
                },
                { name: 'full_name', type: 'string', required: true },
              ],
            },
          };

          const state = {
            ...initialState,
            components: {},
            initialComponents: {},
            contentTypes: { [contentTypeUID]: contentType },
            initialContentTypes: { [contentTypeUID]: contentType },
            modifiedData: {
              components: {},
              contentType,
            },
          };

          const action = {
            type: EDIT_ATTRIBUTE,
            attributeToSet: {
              relation: 'oneToMany',
              targetAttribute: null,
              target: contentTypeUID,
              type: 'relation',
              name: 'many_ways',
            },
            forTarget: 'contentType',
            targetUid: contentTypeUID,
            initialAttribute: {
              relation: 'oneToOne',
              targetAttribute: null,
              target: contentTypeUID,
              name: 'one_way',
            },
            shouldAddComponentToData: false,
          };

          const expected = {
            ...initialState,
            components: {},
            initialComponents: {},
            contentTypes: { [contentTypeUID]: contentType },
            initialContentTypes: { [contentTypeUID]: contentType },
            modifiedData: {
              components: {},
              contentType: {
                ...contentType,
                schema: {
                  ...contentType.schema,
                  attributes: [
                    { name: 'geolocation', type: 'json', required: true },
                    { name: 'city', type: 'string', required: true },
                    { name: 'postal_code', type: 'string' },
                    {
                      name: 'many_ways',
                      relation: 'oneToMany',
                      target: contentTypeUID,
                      targetAttribute: null,
                      type: 'relation',
                    },
                    {
                      name: 'category',
                      relation: 'oneToOne',
                      target: 'application::category.category',
                      targetAttribute: null,
                      type: 'relation',
                    },
                    {
                      name: 'cover',
                      type: 'media',
                      multiple: false,
                      required: false,
                    },
                    {
                      name: 'images',
                      type: 'media',
                      multiple: true,
                      required: false,
                    },
                    { name: 'full_name', type: 'string', required: true },
                  ],
                },
              },
            },
          };

          expect(reducer(state, action)).toEqual(expected);
        });

        it('Should handle changing the nature from a one side relation (oneWay or manyWay) to a many sides (oneToOne, ...) correctly and preserve the order of the attributes', () => {
          const contentTypeUID = 'application::address.address';
          const contentType = {
            uid: contentTypeUID,
            schema: {
              name: 'address',
              description: '',
              connection: 'default',
              collectionName: '',
              attributes: [
                { name: 'geolocation', type: 'json', required: true },
                { name: 'city', type: 'string', required: true },
                { name: 'postal_code', type: 'string' },
                {
                  name: 'one_way',
                  relation: 'oneToOne',
                  targetAttribute: null,
                  target: contentTypeUID,
                  type: 'relation',
                },
                {
                  name: 'category',
                  relation: 'oneToOne',
                  target: 'application::category.category',
                  targetAttribute: null,
                  type: 'relation',
                },
                {
                  name: 'cover',
                  type: 'media',
                  multiple: false,
                  required: false,
                },
                {
                  name: 'images',
                  type: 'media',
                  multiple: true,
                  required: false,
                },
                { name: 'full_name', type: 'string', required: true },
              ],
            },
          };
          const state = {
            ...initialState,
            components: {},
            initialComponents: {},
            contentTypes: { [contentTypeUID]: contentType },
            initialContentTypes: { [contentTypeUID]: contentType },
            modifiedData: {
              components: {},
              contentType,
            },
          };

          const action = {
            type: EDIT_ATTRIBUTE,
            attributeToSet: {
              relation: 'oneToOne',
              targetAttribute: 'address',
              target: contentTypeUID,
              type: 'relation',
              name: 'one_way',
            },
            forTarget: 'contentType',
            targetUid: contentTypeUID,
            initialAttribute: {
              relation: 'oneToOne',
              targetAttribute: null,
              target: contentTypeUID,
              type: 'relation',
              name: 'one_way',
            },
            shouldAddComponentToData: false,
          };

          const expected = {
            ...initialState,
            components: {},
            initialComponents: {},
            contentTypes: { [contentTypeUID]: contentType },
            initialContentTypes: { [contentTypeUID]: contentType },
            modifiedData: {
              components: {},
              contentType: {
                ...contentType,
                schema: {
                  ...contentType.schema,
                  attributes: [
                    { name: 'geolocation', type: 'json', required: true },
                    { name: 'city', type: 'string', required: true },
                    { name: 'postal_code', type: 'string' },
                    {
                      name: 'one_way',
                      relation: 'oneToOne',
                      target: contentTypeUID,
                      targetAttribute: 'address',
                      type: 'relation',
                    },
                    {
                      name: 'address',
                      relation: 'oneToOne',
                      target: contentTypeUID,
                      targetAttribute: 'one_way',
                      type: 'relation',
                    },
                    {
                      name: 'category',
                      relation: 'oneToOne',
                      target: 'application::category.category',
                      targetAttribute: null,
                      type: 'relation',
                    },
                    {
                      name: 'cover',
                      type: 'media',
                      multiple: false,
                      required: false,
                    },
                    {
                      name: 'images',
                      type: 'media',
                      multiple: true,
                      required: false,
                    },
                    { name: 'full_name', type: 'string', required: true },
                  ],
                },
              },
            },
          };

          expect(reducer(state, action)).toEqual(expected);
        });

        it('Should handle changing the nature from a many side relation to a one side relation correctly and preserve the order of the attributes', () => {
          const contentTypeUID = 'application::address.address';
          const contentType = {
            uid: contentTypeUID,
            schema: {
              name: 'address',
              description: '',
              connection: 'default',
              collectionName: '',
              attributes: [
                { name: 'postal_code', type: 'string' },
                {
                  name: 'left',
                  relation: 'oneToOne',
                  targetAttribute: 'right',
                  target: contentTypeUID,
                  type: 'relation',
                },
                {
                  name: 'right',
                  relation: 'oneToOne',
                  target: contentTypeUID,
                  targetAttribute: 'left',
                  type: 'relation',
                },
                {
                  name: 'category',
                  relation: 'oneToOne',
                  target: 'application::category.category',
                  targetAttribute: null,
                  type: 'relation',
                },
              ],
            },
          };

          const state = {
            ...initialState,
            components: {},
            initialComponents: {},
            contentTypes: { [contentTypeUID]: contentType },
            initialContentTypes: { [contentTypeUID]: contentType },
            modifiedData: {
              components: {},
              contentType,
            },
          };

          const action = {
            type: EDIT_ATTRIBUTE,
            attributeToSet: {
              relation: 'oneToOne',
              targetAttribute: null,
              target: contentTypeUID,
              type: 'relation',
              name: 'one_way',
            },
            forTarget: 'contentType',
            targetUid: contentTypeUID,
            initialAttribute: {
              relation: 'oneToOne',
              target: contentTypeUID,
              targetAttribute: 'right',
              type: 'relation',
              name: 'left',
            },
            shouldAddComponentToData: false,
          };

          const expected = {
            ...initialState,
            components: {},
            initialComponents: {},
            contentTypes: { [contentTypeUID]: contentType },
            initialContentTypes: { [contentTypeUID]: contentType },
            modifiedData: {
              components: {},
              contentType: {
                ...contentType,
                schema: {
                  ...contentType.schema,
                  attributes: [
                    { name: 'postal_code', type: 'string' },
                    {
                      name: 'one_way',
                      relation: 'oneToOne',
                      targetAttribute: null,
                      target: contentTypeUID,
                      type: 'relation',
                    },
                    {
                      name: 'category',
                      relation: 'oneToOne',
                      target: 'application::category.category',
                      targetAttribute: null,
                      type: 'relation',
                    },
                  ],
                },
              },
            },
          };

          expect(reducer(state, action)).toEqual(expected);
        });
      });

      describe('Changing the target of the relation', () => {
        it('Should handle the edition of the target correctly for a one way relation (oneWay, manyWay) with another content type and preserve the order of the attributes', () => {
          const contentTypeUID = 'application::address.address';
          const updatedTargetUID = 'application::category.category';
          const contentType = {
            uid: contentTypeUID,
            schema: {
              name: 'address',
              description: '',
              connection: 'default',
              collectionName: '',
              attributes: [
                {
                  name: 'address',
                  relation: 'oneToOne',
                  targetAttribute: null,
                  target: contentTypeUID,
                  type: 'relation',
                },
                {
                  name: 'category',
                  relation: 'oneToOne',
                  target: 'application::category.category',
                  targetAttribute: null,
                  type: 'relation',
                },
                {
                  name: 'cover',
                  type: 'media',
                  multiple: false,
                  required: false,
                },
              ],
            },
          };

          const state = {
            ...initialState,
            components: {},
            initialComponents: {},
            contentTypes: { [contentTypeUID]: contentType },
            initialContentTypes: { [contentTypeUID]: contentType },
            modifiedData: {
              components: {},
              contentType,
            },
          };

          const action = {
            type: EDIT_ATTRIBUTE,
            attributeToSet: {
              relation: 'oneToOne',
              targetAttribute: null,
              target: updatedTargetUID,
              type: 'relation',
              name: 'one_way',
            },
            forTarget: 'contentType',
            targetUid: contentTypeUID,
            initialAttribute: {
              relation: 'oneToOne',
              targetAttribute: null,
              target: contentTypeUID,
              type: 'relation',
              name: 'address',
            },
            shouldAddComponentToData: false,
          };
          const expected = {
            ...initialState,
            components: {},
            initialComponents: {},
            contentTypes: { [contentTypeUID]: contentType },
            initialContentTypes: { [contentTypeUID]: contentType },
            modifiedData: {
              components: {},
              contentType: {
                ...contentType,
                schema: {
                  ...contentType.schema,
                  attributes: [
                    {
                      name: 'one_way',
                      relation: 'oneToOne',
                      targetAttribute: null,
                      target: updatedTargetUID,
                      type: 'relation',
                    },
                    {
                      name: 'category',
                      relation: 'oneToOne',
                      target: 'application::category.category',
                      targetAttribute: null,
                      type: 'relation',
                    },
                    {
                      name: 'cover',
                      type: 'media',
                      multiple: false,
                      required: false,
                    },
                  ],
                },
              },
            },
          };

          expect(reducer(state, action)).toEqual(expected);
        });

        it('Should remove the opposite attribute and keep the order of the attributes if the relation nature is not a one side', () => {
          const contentTypeUID = 'application::address.address';
          const updatedTargetUID = 'application::category.category';
          const contentType = {
            uid: contentTypeUID,
            schema: {
              name: 'address',
              description: '',
              connection: 'default',
              collectionName: '',
              attributes: [
                { name: 'postal_code', type: 'string' },
                {
                  name: 'many_to_many_left',
                  relation: 'manyToMany',
                  targetAttribute: 'many_to_many_right',
                  target: contentTypeUID,
                  type: 'relation',
                },
                {
                  name: 'many_to_many_right',
                  relation: 'manyToMany',
                  targetAttribute: 'many_to_many_left',
                  target: contentTypeUID,
                  type: 'relation',
                },
                {
                  name: 'category',
                  relation: 'oneToOne',
                  target: 'application::category.category',
                  targetAttribute: null,
                  type: 'relation',
                },
              ],
            },
          };
          const state = {
            ...initialState,
            components: {},
            initialComponents: {},
            contentTypes: { [contentTypeUID]: contentType },
            initialContentTypes: { [contentTypeUID]: contentType },
            modifiedData: {
              components: {},
              contentType,
            },
          };

          const action = {
            type: EDIT_ATTRIBUTE,
            attributeToSet: {
              relation: 'manyToMany',
              targetAttribute: 'many_to_many_right',
              target: updatedTargetUID,
              type: 'relation',
              name: 'many_to_many_left',
            },
            forTarget: 'contentType',
            targetUid: contentTypeUID,
            initialAttribute: {
              relation: 'manyToMany',
              targetAttribute: 'many_to_many_right',
              target: contentTypeUID,
              type: 'relation',
              name: 'many_to_many_left',
            },
            shouldAddComponentToData: false,
          };

          const expected = {
            ...initialState,
            components: {},
            initialComponents: {},
            contentTypes: { [contentTypeUID]: contentType },
            initialContentTypes: { [contentTypeUID]: contentType },
            modifiedData: {
              components: {},
              contentType: {
                ...contentType,
                schema: {
                  ...contentType.schema,
                  attributes: [
                    { name: 'postal_code', type: 'string' },
                    {
                      name: 'many_to_many_left',
                      relation: 'manyToMany',
                      targetAttribute: 'many_to_many_right',
                      target: updatedTargetUID,
                      type: 'relation',
                    },
                    {
                      name: 'category',
                      relation: 'oneToOne',
                      target: 'application::category.category',
                      targetAttribute: null,
                      type: 'relation',
                    },
                  ],
                },
              },
            },
          };

          expect(reducer(state, action)).toEqual(expected);
        });
      });

      describe('Editing the other informations of the relation', () => {
        it('Should handle the edition of the other properties correctly by updating the opposite attribute in the other cases', () => {
          const contentTypeUID = 'application::address.address';
          const contentType = {
            uid: contentTypeUID,
            schema: {
              name: 'address',
              description: '',
              connection: 'default',
              collectionName: '',
              attributes: [
                { name: 'postal_code', type: 'string' },
                {
                  name: 'many_to_many_left',
                  relation: 'manyToMany',
                  targetAttribute: 'many_to_many_right',
                  target: contentTypeUID,
                  type: 'relation',
                },
                {
                  name: 'many_to_many_right',
                  relation: 'manyToMany',
                  targetAttribute: 'many_to_many_left',
                  target: contentTypeUID,
                  type: 'relation',
                },
                {
                  name: 'category',
                  relation: 'oneToOne',
                  target: 'application::category.category',
                  targetAttribute: null,
                  type: 'relation',
                },
              ],
            },
          };

          const state = {
            ...initialState,
            components: {},
            initialComponents: {},
            contentTypes: { [contentTypeUID]: contentType },
            initialContentTypes: { [contentTypeUID]: contentType },
            modifiedData: {
              components: {},
              contentType,
            },
          };

          const action = {
            type: EDIT_ATTRIBUTE,
            attributeToSet: {
              relation: 'manyToMany',
              targetAttribute: 'many_to_many_right_updated',
              target: contentTypeUID,
              type: 'relation',
              name: 'many_to_many_left',
            },
            forTarget: 'contentType',
            targetUid: contentTypeUID,
            initialAttribute: {
              relation: 'manyToMany',
              targetAttribute: 'many_to_many_right',
              target: contentTypeUID,
              type: 'relation',
              name: 'many_to_many_left',
            },
            shouldAddComponentToData: false,
          };

          const expected = {
            ...initialState,
            components: {},
            initialComponents: {},
            contentTypes: { [contentTypeUID]: contentType },
            initialContentTypes: { [contentTypeUID]: contentType },
            modifiedData: {
              components: {},
              contentType: {
                ...contentType,
                schema: {
                  ...contentType.schema,
                  attributes: [
                    { name: 'postal_code', type: 'string' },
                    {
                      name: 'many_to_many_left',
                      relation: 'manyToMany',
                      targetAttribute: 'many_to_many_right_updated',
                      target: contentTypeUID,
                      type: 'relation',
                    },
                    {
                      name: 'many_to_many_right_updated',
                      relation: 'manyToMany',
                      targetAttribute: 'many_to_many_left',
                      target: contentTypeUID,
                      type: 'relation',
                    },
                    {
                      name: 'category',
                      relation: 'oneToOne',
                      target: 'application::category.category',
                      targetAttribute: null,
                      type: 'relation',
                    },
                  ],
                },
              },
            },
          };

          expect(reducer(state, action)).toEqual(expected);
        });

        it('Should handle the edition of the name of the relation correctly for a one side relation', () => {
          const contentTypeUID = 'application::address.address';
          const contentType = {
            uid: contentTypeUID,
            schema: {
              name: 'address',
              description: '',
              connection: 'default',
              collectionName: '',
              attributes: [
                { name: 'postal_code', type: 'string' },
                {
                  name: 'one_way',
                  relation: 'oneToOne',
                  targetAttribute: null,
                  target: contentTypeUID,
                  type: 'relation',
                },
                {
                  name: 'category',
                  relation: 'oneToOne',
                  target: 'application::category.category',
                  targetAttribute: null,
                  type: 'relation',
                },
                {
                  name: 'cover',
                  type: 'media',
                  multiple: false,
                  required: false,
                },
              ],
            },
          };
          const state = {
            ...initialState,
            components: {},
            initialComponents: {},
            contentTypes: { [contentTypeUID]: contentType },
            initialContentTypes: { [contentTypeUID]: contentType },
            modifiedData: {
              components: {},
              contentType,
            },
          };

          const action = {
            type: EDIT_ATTRIBUTE,
            attributeToSet: {
              relation: 'oneToOne',
              targetAttribute: null,
              target: contentTypeUID,
              type: 'relation',
              name: 'one_way_updated',
            },
            forTarget: 'contentType',
            targetUid: contentTypeUID,
            initialAttribute: {
              relation: 'oneToOne',
              targetAttribute: null,
              target: contentTypeUID,
              type: 'relation',
              name: 'one_way',
            },
            shouldAddComponentToData: false,
          };

          const expected = {
            ...initialState,
            components: {},
            initialComponents: {},
            contentTypes: { [contentTypeUID]: contentType },
            initialContentTypes: { [contentTypeUID]: contentType },
            modifiedData: {
              components: {},
              contentType: {
                ...contentType,
                schema: {
                  ...contentType.schema,
                  attributes: [
                    { name: 'postal_code', type: 'string' },
                    {
                      name: 'one_way_updated',
                      relation: 'oneToOne',
                      targetAttribute: null,
                      target: contentTypeUID,
                      type: 'relation',
                    },
                    {
                      name: 'category',
                      relation: 'oneToOne',
                      target: 'application::category.category',
                      targetAttribute: null,
                      type: 'relation',
                    },
                    {
                      name: 'cover',
                      type: 'media',
                      multiple: false,
                      required: false,
                    },
                  ],
                },
              },
            },
          };

          expect(reducer(state, action)).toEqual(expected);
        });
      });
    });

    describe('Editing a relation with another content type', () => {
      it('Should not create an opposite attribute if the target is the same content type and the nature is a one side relation (oneWay, manyWay)', () => {
        const contentTypeUID = 'application::category.category';
        const updatedTargetUID = 'application::address.address';
        const contentType = {
          uid: contentTypeUID,
          schema: {
            name: 'address',
            description: '',
            connection: 'default',
            collectionName: '',
            attributes: [
              { name: 'postal_code', type: 'string' },
              {
                name: 'one_way',
                relation: 'oneToOne',
                targetAttribute: null,
                target: contentTypeUID,
                type: 'relation',
              },
              {
                name: 'category',
                relation: 'oneToOne',
                target: 'application::category.category',
                targetAttribute: null,
                type: 'relation',
              },
              {
                name: 'cover',
                type: 'media',
                multiple: false,
                required: false,
              },
            ],
          },
        };
        const state = {
          ...initialState,
          components: {},
          initialComponents: {},
          contentTypes: { [contentTypeUID]: contentType },
          initialContentTypes: { [contentTypeUID]: contentType },
          modifiedData: {
            components: {},
            contentType,
          },
        };

        const action = {
          type: EDIT_ATTRIBUTE,
          attributeToSet: {
            relation: 'oneToOne',
            targetAttribute: null,
            target: updatedTargetUID,
            type: 'relation',
            name: 'one_way',
          },
          forTarget: 'contentType',
          targetUid: contentTypeUID,
          initialAttribute: {
            relation: 'oneToOne',
            targetAttribute: null,
            target: contentTypeUID,
            type: 'relation',
            name: 'one_way',
          },
          shouldAddComponentToData: false,
        };
        const expected = {
          ...initialState,
          components: {},
          initialComponents: {},
          contentTypes: { [contentTypeUID]: contentType },
          initialContentTypes: { [contentTypeUID]: contentType },
          modifiedData: {
            components: {},
            contentType: {
              ...contentType,
              schema: {
                ...contentType.schema,
                attributes: [
                  { name: 'postal_code', type: 'string' },
                  {
                    name: 'one_way',
                    relation: 'oneToOne',
                    targetAttribute: null,
                    target: updatedTargetUID,
                    type: 'relation',
                  },
                  {
                    name: 'category',
                    relation: 'oneToOne',
                    target: 'application::category.category',
                    targetAttribute: null,
                    type: 'relation',
                  },
                  {
                    name: 'cover',
                    type: 'media',
                    multiple: false,
                    required: false,
                  },
                ],
              },
            },
          },
        };

        expect(reducer(state, action)).toEqual(expected);
      });

      it('Should create an opposite attribute if the target is the same content type and the nature is not a one side relation (oneToOne, ...)', () => {
        const originalTargetUID = 'application::category.category';
        const contentTypeUID = 'application::address.address';
        const contentType = {
          uid: contentTypeUID,
          schema: {
            name: 'address',
            description: '',
            connection: 'default',
            collectionName: '',
            attributes: [
              { name: 'postal_code', type: 'string' },
              {
                name: 'one_to_many',
                relation: 'oneToMany',
                targetAttribute: 'many_to_one',
                target: originalTargetUID,
                type: 'relation',
              },
              {
                name: 'category',
                relation: 'oneToOne',
                target: 'application::category.category',
                targetAttribute: null,
                type: 'relation',
              },
              {
                name: 'cover',
                type: 'media',
                multiple: false,
                required: false,
              },
            ],
          },
        };
        const state = {
          ...initialState,
          components: {},
          initialComponents: {},
          contentTypes: { [contentTypeUID]: contentType },
          initialContentTypes: { [contentTypeUID]: contentType },
          modifiedData: {
            components: {},
            contentType,
          },
        };

        const action = {
          type: EDIT_ATTRIBUTE,
          attributeToSet: {
            relation: 'oneToMany',
            targetAttribute: 'many_to_one',
            target: contentTypeUID,
            type: 'relation',
            name: 'one_to_many',
          },
          forTarget: 'contentType',
          targetUid: contentTypeUID,
          initialAttribute: {
            relation: 'oneToMany',
            targetAttribute: 'many_to_one',
            target: originalTargetUID,
            type: 'relation',
            name: 'one_to_many',
          },
          shouldAddComponentToData: false,
        };

        const expected = {
          ...initialState,
          components: {},
          initialComponents: {},
          contentTypes: { [contentTypeUID]: contentType },
          initialContentTypes: { [contentTypeUID]: contentType },
          modifiedData: {
            components: {},
            contentType: {
              ...contentType,
              schema: {
                ...contentType.schema,
                attributes: [
                  { name: 'postal_code', type: 'string' },
                  {
                    name: 'one_to_many',
                    relation: 'oneToMany',
                    targetAttribute: 'many_to_one',
                    target: contentTypeUID,
                    type: 'relation',
                  },
                  {
                    name: 'many_to_one',
                    relation: 'manyToOne',
                    targetAttribute: 'one_to_many',
                    target: contentTypeUID,
                    type: 'relation',
                  },
                  {
                    name: 'category',
                    relation: 'oneToOne',
                    target: 'application::category.category',
                    targetAttribute: null,
                    type: 'relation',
                  },
                  {
                    name: 'cover',
                    type: 'media',
                    multiple: false,
                    required: false,
                  },
                ],
              },
            },
          },
        };

        expect(reducer(state, action)).toEqual(expected);
      });

      it('Should create an opposite attribute if the target is the same content type and the nature is manyToMany', () => {
        const originalTargetUID = 'application::category.category';
        const contentTypeUID = 'application::address.address';
        const contentType = {
          uid: contentTypeUID,
          schema: {
            name: 'address',
            description: '',
            connection: 'default',
            collectionName: '',
            attributes: [
              { name: 'postal_code', type: 'string' },
              {
                name: 'many_to_many_left',
                relation: 'manyToMany',
                targetAttribute: 'many_to_many_right',
                target: originalTargetUID,
                type: 'relation',
              },
              {
                name: 'category',
                relation: 'oneToOne',
                target: 'application::category.category',
                targetAttribute: null,
                type: 'relation',
              },
              {
                name: 'cover',
                type: 'media',
                multiple: false,
                required: false,
              },
            ],
          },
        };
        const state = {
          ...initialState,
          components: {},
          initialComponents: {},
          contentTypes: { [contentTypeUID]: contentType },
          initialContentTypes: { [contentTypeUID]: contentType },
          modifiedData: {
            components: {},
            contentType,
          },
        };

        const action = {
          type: EDIT_ATTRIBUTE,
          attributeToSet: {
            relation: 'manyToMany',
            targetAttribute: 'many_to_many_right',
            target: contentTypeUID,
            type: 'relation',
            name: 'many_to_many_left',
          },
          forTarget: 'contentType',
          targetUid: contentTypeUID,
          initialAttribute: {
            relation: 'manyToMany',
            targetAttribute: 'many_to_many_right',
            target: originalTargetUID,
            type: 'relation',
            name: 'many_to_many_left',
          },
          shouldAddComponentToData: false,
        };
        const expected = {
          ...initialState,
          components: {},
          initialComponents: {},
          contentTypes: { [contentTypeUID]: contentType },
          initialContentTypes: { [contentTypeUID]: contentType },
          modifiedData: {
            components: {},
            contentType: {
              ...contentType,
              schema: {
                ...contentType.schema,
                attributes: [
                  { name: 'postal_code', type: 'string' },
                  {
                    name: 'many_to_many_left',
                    relation: 'manyToMany',
                    targetAttribute: 'many_to_many_right',
                    target: contentTypeUID,
                    type: 'relation',
                  },
                  {
                    name: 'many_to_many_right',
                    relation: 'manyToMany',
                    targetAttribute: 'many_to_many_left',
                    target: contentTypeUID,
                    type: 'relation',
                  },
                  {
                    name: 'category',
                    relation: 'oneToOne',
                    target: 'application::category.category',
                    targetAttribute: null,
                    type: 'relation',
                  },
                  {
                    name: 'cover',
                    type: 'media',
                    multiple: false,
                    required: false,
                  },
                ],
              },
            },
          },
        };

        expect(reducer(state, action)).toEqual(expected);
      });
    });
  });
});
