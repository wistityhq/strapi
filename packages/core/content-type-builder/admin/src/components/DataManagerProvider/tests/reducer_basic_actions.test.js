import get from 'lodash/get';
import reducer, { initialState } from '../reducer';
import testData from './data';
import * as actions from '../constants';

describe('CTB | components | DataManagerProvider | reducer | basics actions ', () => {
  it('Should return the initial state', () => {
    const state = { ...initialState };

    expect(reducer(state, { type: 'TEST' })).toEqual(initialState);
  });

  describe('ADD_CREATED_COMPONENT_TO_DYNAMIC_ZONE', () => {
    it('should add the created component to the dynamic zone', () => {
      const createdComponent = {
        uid: 'default.test',
        category: 'default',
        isTemporary: true,
        schema: {
          icon: 'book',
          name: 'test',
          collectionName: '',
          attributes: [],
        },
      };

      const components = {
        'default.test': createdComponent,
        'default.other': {
          uid: 'default.other',
          category: 'default',
          schema: {
            icon: 'book',
            name: 'test',
            collectionName: '',
            attributes: [],
          },
        },
      };
      const contentType = {
        uid: 'application::test',
        schema: {
          name: 'test',
          attributes: [
            {
              name: 'dz',
              type: 'dynamiczone',
              components: ['default.other'],
            },
          ],
        },
      };

      const state = {
        ...initialState,
        components,
        modifiedData: {
          components,
          contentType,
        },
      };

      const expected = {
        ...initialState,
        components,
        modifiedData: {
          components,
          contentType: {
            uid: 'application::test',
            schema: {
              name: 'test',
              attributes: [
                {
                  name: 'dz',
                  type: 'dynamiczone',
                  components: ['default.other', 'default.test'],
                },
              ],
            },
          },
        },
      };

      const action = {
        type: actions.ADD_CREATED_COMPONENT_TO_DYNAMIC_ZONE,
        dynamicZoneTarget: 'dz',
        componentsToAdd: ['default.test'],
      };

      expect(reducer(state, action)).toEqual(expected);
    });
  });

  describe('CANCEL_CHANGES', () => {
    it('Should set the modifiedData and the components object with the initial ones', () => {
      const state = {
        components: {
          test: {
            something: true,
          },
          other: {
            something: false,
          },
        },
        initialComponents: {
          test: {
            something: false,
          },
          other: {
            something: false,
          },
        },
        modifiedData: {
          components: {
            test: {
              something: true,
            },
            other: {
              something: false,
            },
          },
          contentType: {
            uid: 'something',
            name: 'test',
          },
        },
        initialData: {
          components: {
            test: {
              something: false,
            },
            other: {
              something: false,
            },
          },
          contentType: {
            uid: 'something',
            name: 'something',
          },
        },
      };

      const expected = {
        components: {
          test: {
            something: false,
          },
          other: {
            something: false,
          },
        },
        initialComponents: {
          test: {
            something: false,
          },
          other: {
            something: false,
          },
        },
        modifiedData: {
          components: {
            test: {
              something: false,
            },
            other: {
              something: false,
            },
          },
          contentType: {
            uid: 'something',
            name: 'something',
          },
        },
        initialData: {
          components: {
            test: {
              something: false,
            },
            other: {
              something: false,
            },
          },
          contentType: {
            uid: 'something',
            name: 'something',
          },
        },
      };

      expect(reducer(state, { type: actions.CANCEL_CHANGES })).toEqual(expected);
    });
  });

  describe('CHANGE_DYNAMIC_ZONE_COMPONENTS', () => {
    it('Should add the component to the dz field and to the modifiedData.components if the added component is not already in the modifiedData.components', () => {
      const componentUID = 'default.openingtimes';
      const component = testData.components[componentUID];

      const ct = testData.contentTypes['application::address.address'];

      const contentType = {
        ...ct,
        schema: {
          ...ct.schema,
          attributes: [
            {
              name: 'price_range',
              enum: ['very_cheap', 'cheap', 'average', 'expensive', 'very_expensive'],
              type: 'enumeration',
            },
            {
              name: 'opening_times',
              component: 'default.openingtimes',
              type: 'component',
              repeatable: true,
              min: 1,
              max: 10,
            },
            {
              name: 'dz',
              type: 'dynamiczone',
              components: ['default.openingtimes'],
            },
          ],
        },
      };

      const state = {
        ...initialState,
        components: testData.components,
        modifiedData: {
          components: {
            [componentUID]: component,
          },
          contentType,
        },
      };

      const expected = {
        ...initialState,
        components: testData.components,
        modifiedData: {
          components: {
            [componentUID]: component,
            'default.dish': testData.components['default.dish'],
          },
          contentType: {
            ...contentType,
            schema: {
              ...contentType.schema,
              attributes: [
                {
                  name: 'price_range',
                  enum: ['very_cheap', 'cheap', 'average', 'expensive', 'very_expensive'],
                  type: 'enumeration',
                },
                {
                  name: 'opening_times',
                  component: 'default.openingtimes',
                  type: 'component',
                  repeatable: true,
                  min: 1,
                  max: 10,
                },
                {
                  name: 'dz',
                  type: 'dynamiczone',
                  components: ['default.openingtimes', 'default.dish'],
                },
              ],
            },
          },
        },
      };

      const action = {
        type: actions.CHANGE_DYNAMIC_ZONE_COMPONENTS,
        dynamicZoneTarget: 'dz',
        newComponents: ['default.dish'],
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should add the component to the dz field and the nestedComponents the modifiedData.components', () => {
      const componentUID = 'default.openingtimes';
      const component = get(testData, ['components', componentUID]);

      const contentType = {
        uid: 'application::address.address',
        schema: {
          name: 'address',
          description: '',
          connection: 'default',
          collectionName: '',
          attributes: [{ name: 'dz', type: 'dynamiczone', components: [componentUID] }],
        },
      };

      const state = {
        ...initialState,
        components: testData.components,
        modifiedData: {
          components: {
            [componentUID]: component,
          },
          contentType,
        },
      };

      const componentToAddUid = 'default.closingperiod';

      const action = {
        type: actions.CHANGE_DYNAMIC_ZONE_COMPONENTS,
        dynamicZoneTarget: 'dz',
        newComponents: [componentToAddUid],
      };

      const expected = {
        ...initialState,
        components: testData.components,
        modifiedData: {
          components: {
            [componentUID]: component,
            'default.dish': testData.components['default.dish'],
            [componentToAddUid]: testData.components[componentToAddUid],
          },
          contentType: {
            uid: 'application::address.address',
            schema: {
              name: 'address',
              description: '',
              connection: 'default',
              collectionName: '',
              attributes: [
                { name: 'dz', type: 'dynamiczone', components: [componentUID, componentToAddUid] },
              ],
            },
          },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });
  });

  describe('CREATE_COMPONENT_SCHEMA', () => {
    it('Should add the created component schema to the components object when creating a component using the left menu link', () => {
      const action = {
        type: actions.CREATE_COMPONENT_SCHEMA,
        data: { name: 'new component', icon: 'arrow-alt-circle-down' },
        componentCategory: 'test',
        schemaType: 'component',
        uid: 'test.new-component',
        shouldAddComponentToData: false,
      };

      const state = {
        ...initialState,
        components: testData.components,
        initialComponents: testData.components,
      };

      const expected = {
        ...initialState,
        components: {
          ...testData.components,
          [action.uid]: {
            uid: action.uid,
            isTemporary: true,
            category: action.componentCategory,
            schema: {
              ...action.data,
              attributes: [],
            },
          },
        },
        initialComponents: testData.components,
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should add the created component schema to the components object, create the attribute and also add the created component to modifiedData.components when using the add attribute modal', () => {
      const action = {
        type: actions.CREATE_COMPONENT_SCHEMA,
        data: { name: 'new component', icon: 'arrow-alt-circle-down' },
        componentCategory: 'test',
        schemaType: 'component',
        uid: 'test.new-component',
        shouldAddComponentToData: true,
      };
      const compoToCreate = {
        uid: action.uid,
        isTemporary: true,
        category: action.componentCategory,
        schema: {
          ...action.data,
          attributes: [],
        },
      };

      const state = {
        ...initialState,
        components: testData.components,
        initialComponents: testData.components,
        modifiedData: {
          components: {},
          contentType: { ok: true },
        },
      };

      const expected = {
        ...initialState,
        components: {
          ...testData.components,
          [action.uid]: compoToCreate,
        },
        initialComponents: testData.components,
        modifiedData: {
          components: {
            [action.uid]: compoToCreate,
          },
          contentType: { ok: true },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });
  });

  describe('CREATE_SCHEMA', () => {
    it('Should create a content type schema correctly', () => {
      const uid = 'application::test';
      const data = {
        collectionName: 'test',
        name: 'test',
      };

      const state = { ...initialState };

      const action = { type: actions.CREATE_SCHEMA, uid, data };

      const expected = {
        ...initialState,
        contentTypes: {
          [uid]: {
            uid,
            isTemporary: true,
            schema: {
              collectionName: data.collectionName,
              name: data.name,
              attributes: [],
            },
          },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });
  });

  describe('DELETE_NOT_SAVED_TYPE', () => {
    it('Should reset the components and and contentTypes object', () => {
      const state = {
        ...initialState,
        components: {
          foo: {},
          bar: {},
        },
        initialComponents: { foo: {} },
        contentTypes: {
          baz: {},
          bat: {},
        },
        initialContentTypes: {
          baz: {},
        },
      };

      const expected = {
        ...initialState,
        components: {
          foo: {},
        },
        initialComponents: { foo: {} },
        contentTypes: {
          baz: {},
        },
        initialContentTypes: {
          baz: {},
        },
      };

      const action = { type: actions.DELETE_NOT_SAVED_TYPE };

      expect(reducer(state, action)).toEqual(expected);
    });
  });

  describe('GET_DATA_SUCCEEDED', () => {
    it('should add api data for the content type builder (content type, components and reserved names)', () => {
      const components = {
        'default.test': {
          uid: 'default.test',
          category: 'default',
          schema: {
            attributes: [],
          },
        },
      };
      const contentTypes = {
        'application::test.test': {
          uid: 'application::test.test',
          schema: {
            attributes: [],
          },
        },
      };
      const reservedNames = {
        models: ['admin', 'ctb'],
        attributes: ['attributes', 'length'],
      };

      const state = { ...initialState };
      const expected = {
        ...initialState,
        components,
        contentTypes,
        initialComponents: components,
        initialContentTypes: contentTypes,
        reservedNames,
        isLoading: false,
      };

      expect(
        reducer(state, {
          type: actions.GET_DATA_SUCCEEDED,
          components,
          contentTypes,
          reservedNames,
        })
      ).toEqual(expected);
    });
  });

  describe('RELOAD_PLUGIN', () => {
    it('Should return the initial state constant', () => {
      const state = { ...initialState, component: { foo: {} } };

      expect(
        reducer(state, {
          type: actions.RELOAD_PLUGIN,
        })
      ).toEqual(initialState);
    });
  });

  describe('REMOVE_COMPONENT_FROM_DYNAMIC_ZONE', () => {
    it('Should remove a component from a dynamic zone', () => {
      const components = {
        'default.openingtimes': {
          uid: 'default.openingtimes',
          category: 'default',
          schema: {
            icon: 'calendar',
            name: 'openingtimes',
            description: '',
            connection: 'default',
            collectionName: 'components_openingtimes',
            attributes: [
              {
                name: 'label',
                type: 'string',
                required: true,
                default: 'something',
              },
              {
                name: 'time',
                type: 'string',
              },
            ],
          },
        },
        'default.dish': {
          uid: 'default.dish',
          category: 'default',
          schema: {
            icon: 'calendar',
            name: 'dish',
            description: '',
            connection: 'default',
            collectionName: 'components_dishes',
            attributes: [
              {
                name: 'label',
                type: 'string',
                required: true,
                default: 'something',
              },

              { name: 'time', type: 'string' },
            ],
          },
        },
      };

      const modifiedData = {
        components,
        contentType: {
          uid: 'application::address.address',
          schema: {
            name: 'address',
            description: '',
            connection: 'default',
            collectionName: 'addresses',
            attributes: [
              {
                name: 'full_name',
                type: 'string',
                required: true,
              },
              {
                name: 'dz',
                type: 'dynamiczone',
                components: ['default.openingtimes', 'default.dish'],
              },
              {
                name: 'otherDz',
                type: 'dynamiczone',
                components: ['default.openingtimes', 'default.dish'],
              },
            ],
          },
        },
      };
      const state = {
        ...initialState,
        components,
        modifiedData,
      };

      const action = {
        type: actions.REMOVE_COMPONENT_FROM_DYNAMIC_ZONE,
        dzName: 'dz',
        componentToRemoveIndex: 1,
      };

      const expected = {
        ...initialState,
        components,
        modifiedData: {
          components,
          contentType: {
            uid: 'application::address.address',
            schema: {
              name: 'address',
              description: '',
              connection: 'default',
              collectionName: 'addresses',
              attributes: [
                {
                  name: 'full_name',
                  type: 'string',
                  required: true,
                },
                {
                  name: 'dz',
                  type: 'dynamiczone',
                  components: ['default.openingtimes'],
                },
                {
                  name: 'otherDz',
                  type: 'dynamiczone',
                  components: ['default.openingtimes', 'default.dish'],
                },
              ],
            },
          },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });
  });

  describe('REMOVE_FIELD_FROM_DISPLAYED_COMPONENT', () => {
    it('Should remove the selected field', () => {
      const state = {
        ...initialState,
        modifiedData: {
          components: {
            'default.test': {
              schema: {
                attributes: [
                  {
                    name: 'text',
                    type: 'text',
                  },
                  {
                    name: 'other',
                    type: 'string',
                  },
                  {
                    name: 'last',
                    type: 'integer',
                  },
                ],
              },
            },
          },
        },
      };

      const action = {
        type: actions.REMOVE_FIELD_FROM_DISPLAYED_COMPONENT,
        componentUid: 'default.test',
        attributeToRemoveName: 'other',
      };

      const expected = {
        ...initialState,
        modifiedData: {
          components: {
            'default.test': {
              schema: {
                attributes: [
                  {
                    name: 'text',
                    type: 'text',
                  },
                  {
                    name: 'last',
                    type: 'integer',
                  },
                ],
              },
            },
          },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });
  });

  describe('SET_MODIFIED_DATA', () => {
    it('Should set the modifiedData object correctly if the user did create a new type', () => {
      const schemaToSet = {
        components: {},
        contentType: {
          uid: 'test',
        },
      };

      const state = {
        ...initialState,
        modifiedData: null,
        initialData: null,
        isLoadingForDataToBeSet: true,
      };

      const expected = {
        ...initialState,
        modifiedData: schemaToSet,
        initialData: schemaToSet,
        isLoadingForDataToBeSet: false,
      };

      expect(
        reducer(state, {
          type: actions.SET_MODIFIED_DATA,
          schemaToSet,
          hasJustCreatedSchema: true,
        })
      ).toEqual(expected);
    });

    it('Should set the modifiedData object correctly if the user did not create a new type', () => {
      const schemaToSet = {
        components: {},
        contentType: {
          uid: 'test',
        },
      };

      const state = {
        ...initialState,
        initialComponents: { ok: true },
        initialContentTypes: { ok: false },
        initialData: null,
        modifiedData: null,
      };
      const expected = {
        ...initialState,
        initialComponents: { ok: true },
        initialContentTypes: { ok: false },
        components: { ok: true },
        contentTypes: { ok: false },
        initialData: schemaToSet,
        modifiedData: schemaToSet,
        isLoadingForDataToBeSet: false,
      };

      expect(
        reducer(state, {
          type: actions.SET_MODIFIED_DATA,
          schemaToSet,
          hasJustCreatedSchema: false,
        })
      ).toEqual(expected);
    });
  });

  describe('UPDATE_SCHEMA', () => {
    it('Should update the modified data correctly if the schemaType is a content type', () => {
      const data = {
        name: 'test1',
        collectionName: 'newTest',
      };

      const state = {
        ...initialState,
        modifiedData: {
          components: {},
          contentType: {
            uid: 'test',
            schema: {
              name: 'test',
              collectionName: 'test',
              attributes: [
                {
                  name: 'something',
                  type: 'string',
                },
              ],
            },
          },
        },
      };

      const action = {
        type: actions.UPDATE_SCHEMA,
        data,
        schemaType: 'contentType',
      };
      const expected = {
        ...initialState,
        modifiedData: {
          components: {},
          contentType: {
            uid: 'test',
            schema: {
              name: 'test1',
              collectionName: 'newTest',
              attributes: [
                {
                  name: 'something',
                  type: 'string',
                },
              ],
            },
          },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should update the modified data correctly if the schemaType is a component', () => {
      const data = {
        name: 'newTest',
        collectionName: 'newTest',
        category: 'test',
        icon: 'test',
      };

      const state = {
        ...initialState,
        components: {
          test: {
            uid: 'test',
            category: 'default',
            schema: {
              name: 'test',
              icon: 'book',
              collectionName: 'components_tests',
              attributes: [
                {
                  name: 'something',
                  type: 'string',
                },
              ],
            },
          },
        },
        modifiedData: {
          components: {},
          component: {
            uid: 'test',
            category: 'default',
            schema: {
              name: 'test',
              icon: 'book',
              collectionName: 'components_tests',
              attributes: [
                {
                  name: 'something',
                  type: 'string',
                },
              ],
            },
          },
        },
      };

      const action = {
        type: actions.UPDATE_SCHEMA,
        data,
        schemaType: 'component',
        uid: 'test',
      };
      const expected = {
        ...initialState,
        components: {
          test: {
            uid: 'test',
            category: 'test',
            schema: {
              name: 'newTest',
              icon: 'test',
              collectionName: 'newTest',
              attributes: [
                {
                  name: 'something',
                  type: 'string',
                },
              ],
            },
          },
        },
        modifiedData: {
          components: {},
          component: {
            uid: 'test',
            category: 'test',
            schema: {
              name: 'newTest',
              icon: 'test',
              collectionName: 'newTest',
              attributes: [
                {
                  name: 'something',
                  type: 'string',
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
