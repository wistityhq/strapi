import reducer, { initialState } from '../reducer';
import { ADD_ATTRIBUTE } from '../constants';

describe('CTB | components | DataManagerProvider | reducer | ADD_ATTRIBUTE', () => {
  describe('Adding a common field that is not a relation', () => {
    it('Should add a text field to a content type correctly', () => {
      const contentType = {
        uid: 'application::category.category',
        schema: {
          name: 'category',
          description: '',
          connection: 'default',
          collectionName: '',
          attributes: [{ name: 'test', type: 'string' }],
        },
      };
      const state = {
        ...initialState,
        modifiedData: {
          components: {},
          contentType,
        },
      };

      const action = {
        type: ADD_ATTRIBUTE,
        attributeToSet: {
          type: 'string',
          name: 'name',
          default: 'something',
          private: true,
          required: true,
          unique: true,
          maxLength: 3,
          minLength: 1,
        },
        forTarget: 'contentType',
        targetUid: 'application::address.address',
        initialAttribute: {},
        shouldAddComponentToData: false,
      };

      const expected = {
        ...initialState,
        modifiedData: {
          components: {},
          contentType: {
            ...contentType,
            schema: {
              ...contentType.schema,
              attributes: [
                ...contentType.schema.attributes,
                {
                  name: 'name',
                  type: 'string',
                  default: 'something',
                  private: true,
                  required: true,
                  unique: true,
                  maxLength: 3,
                  minLength: 1,
                },
              ],
            },
          },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should add an integer field to a component that is an attribute of a content type', () => {
      const compoSchema = {
        uid: 'default.dish',
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
            {
              name: 'picture',
              type: 'media',
              multiple: false,
              required: false,
            },
            {
              name: 'very_long_description',
              type: 'richtext',
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
      const contentType = {
        uid: 'application::country.country',
        schema: {
          name: 'country',
          description: '',
          connection: 'default',
          collectionName: '',
          attributes: [
            { name: 'name', type: 'string', required: true, minLength: 3 },
            { name: 'code', type: 'string', maxLength: 3, unique: true, minLength: 2 },
            { name: 'compo_field', type: 'component', component: 'default.dish' },
          ],
        },
      };

      const state = {
        ...initialState,
        components: {
          'default.dish': compoSchema,
        },
        modifiedData: {
          components: {
            'default.dish': compoSchema,
          },
          contentType,
        },
      };

      const action = {
        type: ADD_ATTRIBUTE,
        attributeToSet: {
          name: 'test',
          type: 'integer',
          default: 2,
          private: true,
          required: true,
          min: null,
        },
        forTarget: 'components',
        targetUid: 'default.dish',
        initialAttribute: {},
        shouldAddComponentToData: false,
      };

      const expected = {
        ...initialState,
        components: {
          'default.dish': compoSchema,
        },
        modifiedData: {
          components: {
            'default.dish': {
              ...compoSchema,

              schema: {
                ...compoSchema.schema,
                attributes: [
                  ...compoSchema.schema.attributes,
                  {
                    name: 'test',
                    type: 'integer',
                    default: 2,
                    private: true,
                    required: true,
                    min: null,
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

  describe('Adding a component field attribute', () => {
    it('Should create the component attribute and add the component to the modifiedData.components if the component is not in the object', () => {
      const contentType = {
        uid: 'application::address.address',
        schema: {
          name: 'address',
          description: '',
          connection: 'default',
          collectionName: '',
          attributes: [
            { name: 'geolocation', type: 'json', required: true },
            { name: 'city', type: 'string', required: true },
            { name: 'postal_coder', type: 'string' },
            {
              name: 'category',
              relation: 'oneToOne',
              target: 'application::category.category',
              targetAttribute: null,
              type: 'relation',
            },
            { name: 'cover', type: 'media', multiple: false, required: false },
            { name: 'images', type: 'media', multiple: true, required: false },
            { name: 'full_name', type: 'string', required: true },
          ],
        },
      };
      const componentToAddUID = 'default.dish';
      const componentSchema = {
        uid: 'default.dish',
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
            {
              name: 'picture',
              type: 'media',
              multiple: false,
              required: false,
            },
            {
              name: 'very_long_description',
              type: 'richtext',
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
        components: {
          [componentToAddUID]: componentSchema,
        },
        initialComponents: {
          [componentToAddUID]: componentSchema,
        },
        contentTypes: {},
        initialContentTypes: {},
        modifiedData: {
          components: {},
          contentType,
        },
      };

      const action = {
        type: ADD_ATTRIBUTE,
        attributeToSet: {
          type: 'component',
          repeatable: true,
          name: 'compoField',
          component: componentToAddUID,
          required: true,
          max: 2,
          min: 1,
        },
        forTarget: 'contentType',
        targetUid: 'application::address.address',
        initialAttribute: {},
        shouldAddComponentToData: true,
      };

      const expected = {
        ...initialState,
        components: {
          [componentToAddUID]: componentSchema,
        },
        initialComponents: {
          [componentToAddUID]: componentSchema,
        },
        contentTypes: {},
        initialContentTypes: {},
        modifiedData: {
          components: {
            [componentToAddUID]: componentSchema,
          },
          contentType: {
            ...contentType,

            schema: {
              ...contentType.schema,
              attributes: [
                ...contentType.schema.attributes,
                {
                  name: 'compoField',
                  type: 'component',
                  repeatable: true,
                  component: componentToAddUID,
                  required: true,
                  max: 2,
                  min: 1,
                },
              ],
            },
          },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should create the component attribute and add the component to the modifiedData.components and its nested components if none of the added components are in the object', () => {
      const contentTypeUID = 'application::address.address';
      const contentType = {
        uid: 'application::address.address',
        schema: {
          name: 'address',
          description: '',
          connection: 'default',
          collectionName: '',
          attributes: [
            { name: 'geolocation', type: 'json', required: true },
            { name: 'city', type: 'string', required: true },
            { name: 'postal_coder', type: 'string' },
            {
              name: 'category',
              relation: 'oneToOne',
              target: 'application::category.category',
              targetAttribute: null,
              type: 'relation',
            },
            { name: 'cover', type: 'media', multiple: false, required: false },
            { name: 'images', type: 'media', multiple: true, required: false },
            { name: 'full_name', type: 'string', required: true },
          ],
        },
      };
      const componentToAddUID = 'default.closingperiod';
      const componentSchema = {
        uid: 'default.closingperiod',
        category: '',
        schema: {
          icon: 'angry',
          name: 'closingperiod',
          description: '',
          connection: 'default',
          collectionName: 'components_closingperiods',
          attributes: [
            {
              name: 'label',
              type: 'string',
            },
            {
              name: 'start_date',
              type: 'date',
              required: true,
            },
            {
              name: 'end_date',
              type: 'date',
              required: true,
            },
            {
              name: 'media',
              type: 'media',
              multiple: false,
              required: false,
            },
            { name: 'dish', component: 'default.dish', type: 'component' },
          ],
        },
      };

      const dishComponentSchema = {
        uid: 'default.dish',
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
            {
              name: 'picture',
              type: 'media',
              multiple: false,
              required: false,
            },
            {
              name: 'very_long_description',
              type: 'richtext',
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
        components: {
          [componentToAddUID]: componentSchema,
          'default.dish': dishComponentSchema,
        },
        initialComponents: {
          [componentToAddUID]: componentSchema,
          'default.dish': dishComponentSchema,
        },
        initialContentTypes: {
          [contentTypeUID]: contentType,
        },
        modifiedData: {
          components: {},
          contentType,
        },
      };

      const action = {
        type: ADD_ATTRIBUTE,
        attributeToSet: {
          type: 'component',
          repeatable: true,
          name: 'compoField',
          component: componentToAddUID,
          required: true,
          max: 2,
          min: 1,
        },
        forTarget: 'contentType',
        targetUid: 'application::address.address',
        initialAttribute: {},
        shouldAddComponentToData: true,
      };

      const expected = {
        ...initialState,
        components: {
          [componentToAddUID]: componentSchema,
          'default.dish': dishComponentSchema,
        },
        initialComponents: {
          [componentToAddUID]: componentSchema,
          'default.dish': dishComponentSchema,
        },
        initialContentTypes: {
          [contentTypeUID]: contentType,
        },
        modifiedData: {
          components: {
            [componentToAddUID]: componentSchema,
            'default.dish': dishComponentSchema,
          },
          contentType: {
            ...contentType,
            schema: {
              ...contentType.schema,
              attributes: [
                ...contentType.schema.attributes,
                {
                  name: 'compoField',
                  type: 'component',
                  repeatable: true,
                  component: componentToAddUID,
                  required: true,
                  max: 2,
                  min: 1,
                },
              ],
            },
          },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should create the component attribute and add the component to the modifiedData.components and only add the nested components that are not in the modifiedData.components object to keep previous the modifications', () => {
      const contentTypeUID = 'application::address.address';
      const contentType = {
        uid: 'application::address.address',
        schema: {
          name: 'address',
          description: '',
          connection: 'default',
          collectionName: '',
          attributes: [
            { name: 'geolocation', type: 'json', required: true },
            { name: 'city', type: 'string', required: true },
            { name: 'postal_coder', type: 'string' },
            {
              name: 'category',
              relation: 'oneToOne',
              target: 'application::category.category',
              targetAttribute: null,
              type: 'relation',
            },
            { name: 'cover', type: 'media', multiple: false, required: false },
            { name: 'images', type: 'media', multiple: true, required: false },
            { name: 'full_name', type: 'string', required: true },
          ],
        },
      };
      const componentToAddUID = 'default.closingperiod';
      const componentSchema = {
        uid: 'default.closingperiod',
        category: '',
        schema: {
          icon: 'angry',
          name: 'closingperiod',
          description: '',
          connection: 'default',
          collectionName: 'components_closingperiods',
          attributes: [
            {
              name: 'label',
              type: 'string',
            },

            {
              name: 'start_date',
              type: 'date',
              required: true,
            },
            {
              name: 'end_date',
              type: 'date',
              required: true,
            },
            {
              name: 'media',
              type: 'media',
              multiple: false,
              required: false,
            },
            { name: 'dish', component: 'default.dish', type: 'component' },
          ],
        },
      };

      const dishComponentSchema = {
        uid: 'default.dish',
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
            {
              name: 'picture',
              type: 'media',
              multiple: false,
              required: false,
            },
            {
              name: 'very_long_description',
              type: 'richtext',
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
        components: {
          [componentToAddUID]: componentSchema,
          'default.dish': dishComponentSchema,
        },
        initialComponents: {
          [componentToAddUID]: componentSchema,
          'default.dish': dishComponentSchema,
        },
        initialContentTypes: {
          [contentTypeUID]: contentType,
        },
        modifiedData: {
          components: {
            'default.dish': {
              ...dishComponentSchema,
              schema: {
                ...dishComponentSchema.schema,
                attributes: [
                  ...dishComponentSchema.schema.attributes,
                  { name: 'test', type: 'string' },
                ],
              },
            },
          },
          contentType,
        },
      };

      const action = {
        type: ADD_ATTRIBUTE,
        attributeToSet: {
          type: 'component',
          repeatable: true,
          name: 'compoField',
          component: componentToAddUID,
          required: true,
          max: 2,
          min: 1,
        },
        forTarget: 'contentType',
        targetUid: contentTypeUID,
        initialAttribute: {},
        shouldAddComponentToData: true,
      };

      const expected = {
        ...initialState,
        components: {
          [componentToAddUID]: componentSchema,
          'default.dish': dishComponentSchema,
        },
        initialComponents: {
          [componentToAddUID]: componentSchema,
          'default.dish': dishComponentSchema,
        },
        initialContentTypes: {
          [contentTypeUID]: contentType,
        },
        modifiedData: {
          components: {
            'default.dish': {
              ...dishComponentSchema,
              schema: {
                ...dishComponentSchema.schema,
                attributes: [
                  ...dishComponentSchema.schema.attributes,
                  { name: 'test', type: 'string' },
                ],
              },
            },
            [componentToAddUID]: componentSchema,
          },
          contentType: {
            ...contentType,
            schema: {
              ...contentType.schema,
              attributes: [
                ...contentType.schema.attributes,
                {
                  name: 'compoField',
                  type: 'component',
                  repeatable: true,
                  component: componentToAddUID,
                  required: true,
                  max: 2,
                  min: 1,
                },
              ],
            },
          },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should create the component correctly in case of creating the component on the fly', () => {
      const componentToCreateUID = 'default.new-compo';
      const componentToCreate = {
        uid: componentToCreateUID,
        isTemporary: true,
        category: 'default',
        schema: {
          name: 'newCompo',
          icon: 'ad',
          attributes: {},
        },
      };
      const contentTypeUID = 'application::address.address';
      const contentType = {
        uid: 'application::address.address',
        schema: {
          name: 'address',
          description: '',
          connection: 'default',
          collectionName: '',
          attributes: [
            { name: 'images', type: 'media', multiple: true, required: false },
            { name: 'full_name', type: 'string', required: true },
          ],
        },
      };

      const state = {
        ...initialState,
        components: {
          [componentToCreateUID]: componentToCreate,
        },
        modifiedData: {
          components: {
            [componentToCreateUID]: componentToCreate,
          },
          contentType,
        },
      };

      const action = {
        type: ADD_ATTRIBUTE,
        attributeToSet: {
          name: 'newCompo',
          type: 'component',
          repeatable: false,
          component: componentToCreateUID,
        },
        forTarget: 'contentType',
        targetUid: contentTypeUID,
        initialAttribute: undefined,
        shouldAddComponentToData: false,
      };

      const expected = {
        ...initialState,
        components: {
          [componentToCreateUID]: componentToCreate,
        },
        modifiedData: {
          components: {
            [componentToCreateUID]: componentToCreate,
          },
          contentType: {
            ...contentType,
            schema: {
              ...contentType.schema,
              attributes: [
                ...contentType.schema.attributes,
                {
                  name: 'newCompo',
                  type: 'component',
                  repeatable: false,
                  component: componentToCreateUID,
                },
              ],
            },
          },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });
  });

  describe('Adding a dynamic zone', () => {
    it('Should create the dynamiczone attribute correctly', () => {
      const contentTypeUID = 'application::address.address';
      const contentType = {
        uid: 'application::address.address',
        schema: {
          name: 'address',
          description: '',
          connection: 'default',
          collectionName: '',
          attributes: [
            { name: 'images', type: 'media', multiple: true, required: false },
            { name: 'full_name', type: 'string', required: true },
          ],
        },
      };

      const state = {
        ...initialState,
        modifiedData: {
          components: {},
          contentType,
        },
      };

      const action = {
        type: ADD_ATTRIBUTE,
        attributeToSet: {
          type: 'dynamiczone',
          components: [],
          name: 'dz',
        },
        forTarget: 'contentType',
        targetUid: contentTypeUID,
        initialAttribute: {},
        shouldAddComponentToData: false,
      };

      const expected = {
        ...initialState,
        modifiedData: {
          components: {},
          contentType: {
            ...contentType,
            schema: {
              ...contentType.schema,
              attributes: [
                ...contentType.schema.attributes,
                { name: 'dz', type: 'dynamiczone', components: [] },
              ],
            },
          },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });
  });

  describe('Adding a relation with another content type', () => {
    it('Should add the relation attribute correctly for a content type', () => {
      const contentTypeUID = 'application::address.address';
      const contentType = {
        uid: 'application::address.address',
        schema: {
          name: 'address',
          description: '',
          connection: 'default',
          collectionName: '',
          attributes: [
            { name: 'geolocation', type: 'json', required: true },
            { name: 'city', type: 'string', required: true },
            { name: 'postal_coder', type: 'string' },
            {
              name: 'category',
              relation: 'oneToOne',
              target: 'application::category.category',
              targetAttribute: null,
              type: 'relation',
            },
            { name: 'cover', type: 'media', multiple: false, required: false },
            { name: 'images', type: 'media', multiple: true, required: false },
            { name: 'full_name', type: 'string', required: true },
          ],
        },
      };
      const targetContentTypeUID = 'application::category.category';
      const targetContentTypeSchema = {
        uid: 'application::category.category',
        schema: {
          name: 'category',
          description: '',
          connection: 'default',
          collectionName: '',
          attributes: [{ name: 'name', type: 'string' }],
        },
      };

      const state = {
        ...initialState,
        contentTypes: {
          [contentTypeUID]: contentType,
          [targetContentTypeUID]: targetContentTypeSchema,
        },
        initialContentTypes: {
          [contentTypeUID]: contentType,
          [targetContentTypeUID]: targetContentTypeSchema,
        },
        modifiedData: {
          components: {},
          contentType,
        },
      };

      const action = {
        type: ADD_ATTRIBUTE,
        attributeToSet: {
          name: 'categories',
          relation: 'oneToMany',
          targetAttribute: 'address',
          target: targetContentTypeUID,
          type: 'relation',
        },
        forTarget: 'contentType',
        targetUid: contentTypeUID,
        initialAttribute: {},
        shouldAddComponentToData: false,
      };

      const expected = {
        ...initialState,
        contentTypes: {
          [contentTypeUID]: contentType,
          [targetContentTypeUID]: targetContentTypeSchema,
        },
        initialContentTypes: {
          [contentTypeUID]: contentType,
          [targetContentTypeUID]: targetContentTypeSchema,
        },
        modifiedData: {
          components: {},
          contentType: {
            ...contentType,
            schema: {
              ...contentType.schema,
              attributes: [
                ...contentType.schema.attributes,
                {
                  name: 'categories',
                  relation: 'oneToMany',
                  targetAttribute: 'address',
                  target: targetContentTypeUID,
                  type: 'relation',
                },
              ],
            },
          },
        },
      };

      // const expected = state.setIn(
      //   ['modifiedData', 'contentType', 'schema', 'attributes', 'categories'],
      //   fromJS({
      //     relation: 'oneToMany',
      //     targetAttribute: 'address',
      //     target: targetContentTypeUID,
      //     type: 'relation',
      //   })
      // );

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should add the relation attribute correctly for a component', () => {
      const componentUID = 'default.dish';
      const targetContentTypeUID = 'application::category.category';
      const compoSchema = {
        uid: 'default.dish',
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
          ],
        },
      };

      const state = {
        ...initialState,
        components: { [componentUID]: compoSchema },
        initialComponents: { [componentUID]: compoSchema },
        modifiedData: {
          components: {},
          component: compoSchema,
        },
      };

      const action = {
        type: ADD_ATTRIBUTE,
        attributeToSet: {
          name: 'address',
          relation: 'oneToOne',
          targetAttribute: null,
          target: targetContentTypeUID,
          type: 'relation',
        },
        forTarget: 'component',
        targetUid: componentUID,
        initialAttribute: {},
        shouldAddComponentToData: false,
      };

      const expected = {
        ...initialState,
        components: { [componentUID]: compoSchema },
        initialComponents: { [componentUID]: compoSchema },
        modifiedData: {
          components: {},
          component: {
            ...compoSchema,
            schema: {
              ...compoSchema.schema,
              attributes: [
                ...compoSchema.schema.attributes,
                {
                  name: 'address',
                  relation: 'oneToOne',
                  targetAttribute: null,
                  target: targetContentTypeUID,
                  type: 'relation',
                },
              ],
            },
          },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should add the relation attribute correctly for a component from the modifiedData.components object', () => {
      const componentUID = 'default.dish';
      const targetContentTypeUID = 'application::category.category';

      const compoSchema = {
        uid: 'default.dish',
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
          ],
        },
      };

      const state = {
        ...initialState,
        components: { [componentUID]: compoSchema },
        initialComponents: { [componentUID]: compoSchema },
        modifiedData: {
          components: { [componentUID]: compoSchema },
          contenType: {},
        },
      };

      const action = {
        type: ADD_ATTRIBUTE,
        attributeToSet: {
          name: 'address',
          relation: 'oneToOne',
          targetAttribute: null,
          target: targetContentTypeUID,
          type: 'relation',
          private: true,
        },
        forTarget: 'components',
        targetUid: componentUID,
        initialAttribute: {},
        shouldAddComponentToData: false,
      };

      const expected = {
        ...initialState,
        components: { [componentUID]: compoSchema },
        initialComponents: { [componentUID]: compoSchema },
        modifiedData: {
          components: {
            [componentUID]: {
              ...compoSchema,
              schema: {
                ...compoSchema.schema,
                attributes: [
                  ...compoSchema.schema.attributes,
                  {
                    name: 'address',
                    relation: 'oneToOne',
                    targetAttribute: null,
                    target: targetContentTypeUID,
                    type: 'relation',
                    private: true,
                  },
                ],
              },
            },
          },
          contenType: {},
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });
  });

  describe('Adding a relation with the same content type', () => {
    it('Should not create an opposite attribute if the relation is oneWay', () => {
      const contentTypeUID = 'application::address.address';
      const contentType = {
        uid: 'application::address.address',
        schema: {
          name: 'address',
          description: '',
          connection: 'default',
          collectionName: '',
          attributes: [{ name: 'full_name', type: 'string', required: true }],
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
        type: ADD_ATTRIBUTE,
        forTarget: 'contentType',
        targetUid: contentTypeUID,
        attributeToSet: {
          name: 'address',
          relation: 'oneToOne',
          targetAttribute: null,
          target: contentTypeUID,
          type: 'relation',
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
                ...contentType.schema.attributes,
                {
                  name: 'address',
                  relation: 'oneToOne',
                  targetAttribute: null,
                  target: contentTypeUID,
                  type: 'relation',
                },
              ],
            },
          },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should not create an opposite attribute if the relation is manyWay', () => {
      const contentTypeUID = 'application::address.address';
      const contentType = {
        uid: 'application::address.address',
        schema: {
          name: 'address',
          description: '',
          connection: 'default',
          collectionName: '',
          attributes: [{ name: 'full_name', type: 'string', required: true }],
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
        type: ADD_ATTRIBUTE,
        forTarget: 'contentType',
        targetUid: contentTypeUID,
        attributeToSet: {
          name: 'addresses',
          relation: 'oneToMany',
          targetAttribute: null,
          target: contentTypeUID,
          type: 'relation',
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
                ...contentType.schema.attributes,
                {
                  name: 'addresses',
                  relation: 'oneToMany',
                  targetAttribute: null,
                  target: contentTypeUID,
                  type: 'relation',
                },
              ],
            },
          },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should handle the oneToOne relation correctly and create the opposite attribute', () => {
      const contentTypeUID = 'application::address.address';
      const contentType = {
        uid: 'application::address.address',
        schema: {
          name: 'address',
          description: '',
          connection: 'default',
          collectionName: '',
          attributes: [
            { name: 'images', type: 'media', multiple: true, required: false },
            { name: 'full_name', type: 'string', required: true },
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

      const name = 'address_left_side';
      const targetAttribute = 'address_right_side';
      const attribute = {
        name,
        relation: 'oneToOne',
        targetAttribute,
        target: contentTypeUID,
        type: 'relation',
      };
      const action = {
        type: ADD_ATTRIBUTE,
        forTarget: 'contentType',
        targetUid: contentTypeUID,
        attributeToSet: attribute,
        shouldAddComponentToData: false,
      };
      const oppositeAttribute = {
        name: targetAttribute,
        relation: 'oneToOne',
        target: contentTypeUID,
        targetAttribute: name,
        type: 'relation',
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
              attributes: [...contentType.schema.attributes, attribute, oppositeAttribute],
            },
          },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should handle the oneToMany relation correctly and create the opposite attribute', () => {
      const contentTypeUID = 'application::address.address';
      const contentType = {
        uid: 'application::address.address',
        schema: {
          name: 'address',
          description: '',
          connection: 'default',
          collectionName: '',
          attributes: [{ name: 'full_name', type: 'string', required: true }],
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

      const name = 'address_left_side';
      const targetAttribute = 'address_right_side';

      const attribute = {
        name,
        relation: 'oneToMany',
        targetAttribute,
        target: contentTypeUID,
        type: 'relation',
      };
      const action = {
        type: ADD_ATTRIBUTE,
        forTarget: 'contentType',
        targetUid: contentTypeUID,
        attributeToSet: attribute,
        shouldAddComponentToData: false,
      };
      const oppositeAttribute = {
        name: targetAttribute,
        relation: 'manyToOne',
        target: contentTypeUID,
        targetAttribute: name,
        type: 'relation',
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
              attributes: [...contentType.schema.attributes, attribute, oppositeAttribute],
            },
          },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should handle the manyToOne relation correctly and create the opposite attribute', () => {
      const contentTypeUID = 'application::address.address';
      const contentType = {
        uid: 'application::address.address',
        schema: {
          name: 'address',
          description: '',
          connection: 'default',
          collectionName: '',
          attributes: [{ name: 'full_name', type: 'string', required: true }],
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

      const name = 'address_left_side';
      const targetAttribute = 'address_right_side';
      const attribute = {
        name,
        relation: 'manyToOne',
        targetAttribute,
        target: contentTypeUID,
        type: 'relation',
      };
      const action = {
        type: ADD_ATTRIBUTE,
        forTarget: 'contentType',
        targetUid: contentTypeUID,
        attributeToSet: attribute,
        shouldAddComponentToData: false,
      };
      const oppositeAttribute = {
        name: targetAttribute,
        relation: 'oneToMany',
        target: contentTypeUID,
        targetAttribute: name,
        type: 'relation',
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
              attributes: [...contentType.schema.attributes, attribute, oppositeAttribute],
            },
          },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should handle the manyToMany relation correctly and create the opposite attribute', () => {
      const contentTypeUID = 'application::address.address';
      const contentType = {
        uid: 'application::address.address',
        schema: {
          name: 'address',
          description: '',
          connection: 'default',
          collectionName: '',
          attributes: [{ name: 'full_name', type: 'string', required: true }],
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

      const name = 'address_left_side';
      const targetAttribute = 'address_right_side';
      const attribute = {
        name,
        relation: 'manyToMany',
        targetAttribute,
        target: contentTypeUID,
        type: 'relation',
      };
      const action = {
        type: ADD_ATTRIBUTE,
        forTarget: 'contentType',
        targetUid: contentTypeUID,
        attributeToSet: attribute,
        shouldAddComponentToData: false,
      };
      const oppositeAttribute = {
        name: targetAttribute,
        relation: 'manyToMany',
        target: contentTypeUID,
        targetAttribute: name,
        type: 'relation',
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
              attributes: [...contentType.schema.attributes, attribute, oppositeAttribute],
            },
          },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });
  });
});
