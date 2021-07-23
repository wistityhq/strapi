import reducer, { initialState } from '../reducer';
import * as actions from '../constants';

describe('CTB | components | FormModal | reducer | actions', () => {
  describe('ADD_COMPONENTS_TO_DYNAMIC_ZONE', () => {
    it('Should add the components correctly', () => {
      const action = {
        type: actions.ADD_COMPONENTS_TO_DYNAMIC_ZONE,
        components: ['default.test', 'default.test2', 'default.test3'],
        shouldAddComponents: true,
        name: 'components',
      };

      const state = {
        initialData: {},
        modifiedData: {
          type: 'dynamiczone',
          name: 'dz',
          components: ['default.test'],
        },
      };

      const expected = {
        initialData: {},
        modifiedData: {
          type: 'dynamiczone',
          name: 'dz',
          components: ['default.test', 'default.test2', 'default.test3'],
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should remove the components correctly', () => {
      const action = {
        type: actions.ADD_COMPONENTS_TO_DYNAMIC_ZONE,
        components: ['default.test2', 'default.test3'],
        shouldAddComponents: false,
        name: 'components',
      };

      const state = {
        initialData: {},
        modifiedData: {
          type: 'dynamiczone',
          name: 'dz',
          components: ['default.test', 'default.test2', 'default.test3'],
        },
      };

      const expected = {
        initialData: {},
        modifiedData: {
          type: 'dynamiczone',
          name: 'dz',
          components: ['default.test'],
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });
  });

  describe(actions.ON_CHANGE, () => {
    it('Should update the modifiedData object correctly', () => {
      const action = {
        type: actions.ON_CHANGE,
        keys: ['name'],
        value: 'test',
      };

      const state = {
        ...initialState,
        modifiedData: {
          type: 'string',
        },
      };

      const expected = {
        ...initialState,
        modifiedData: {
          name: 'test',
          type: 'string',
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('should remove the default value if the type of date input type has been changed', () => {
      const state = {
        ...initialState,
        modifiedData: {
          name: 'short_movie_time',
          type: 'time',
          default: '00:30:00',
        },
      };
      const action = {
        type: actions.ON_CHANGE,
        keys: ['type'],
        value: 'datetime',
      };
      const expected = {
        ...initialState,
        modifiedData: {
          name: 'short_movie_time',
          type: 'datetime',
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('should not remove the default value if the type of another input type has been changed', () => {
      const state = {
        ...initialState,
        modifiedData: {
          name: 'number_of_movies',
          type: 'integer',
          default: '0',
        },
      };
      const action = {
        type: actions.ON_CHANGE,
        keys: ['type'],
        value: 'biginteger',
      };

      const expected = {
        ...initialState,
        modifiedData: {
          name: 'number_of_movies',
          type: 'biginteger',
          default: '0',
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });
  });

  describe('ON_CHANGE_ALLOWED_TYPE', () => {
    it('Should add the missing types', () => {
      const state = {
        ...initialState,
        modifiedData: {
          allowedTypes: ['images', 'videos'],
        },
      };
      const action = {
        name: 'all',
        value: true,
        type: actions.ON_CHANGE_ALLOWED_TYPE,
      };

      const expected = {
        ...initialState,
        modifiedData: {
          allowedTypes: ['images', 'videos', 'files'],
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should remove the missing types', () => {
      const state = {
        ...initialState,
        modifiedData: {
          allowedTypes: ['images', 'videos', 'files'],
        },
      };
      const action = {
        name: 'all',
        value: false,
        type: actions.ON_CHANGE_ALLOWED_TYPE,
      };

      const expected = {
        ...initialState,
        modifiedData: {
          allowedTypes: null,
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Shoul add the missing type', () => {
      const state = {
        ...initialState,
        modifiedData: {
          allowedTypes: ['videos', 'files'],
        },
      };

      const action = {
        name: 'images',
        value: null,
        type: actions.ON_CHANGE_ALLOWED_TYPE,
      };

      const expected = {
        ...initialState,
        modifiedData: {
          allowedTypes: ['videos', 'files', 'images'],
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should remove the type', () => {
      const state = {
        ...initialState,
        modifiedData: {
          allowedTypes: ['videos', 'images', 'files'],
        },
      };

      const action = {
        name: 'images',
        value: null,
        type: actions.ON_CHANGE_ALLOWED_TYPE,
      };

      const expected = {
        ...initialState,
        modifiedData: {
          allowedTypes: ['videos', 'files'],
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should remove set the allowedTypes to null if removing the last type', () => {
      const state = {
        ...initialState,
        modifiedData: {
          allowedTypes: ['videos'],
        },
      };
      const action = {
        name: 'videos',
        value: null,
        type: actions.ON_CHANGE_ALLOWED_TYPE,
      };
      const expected = {
        ...initialState,
        modifiedData: {
          allowedTypes: null,
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });
  });

  describe('ON_CHANGE_RELATION_TARGET', () => {
    it('Should handle the target change correctly for a one side relation (oneWay, manyWay)', () => {
      const state = {
        ...initialState,
        modifiedData: {
          name: 'category test',
          relation: 'oneToOne',
          targetAttribute: null,
          target: 'application::category.category',
          type: 'relation',
        },
      };
      const action = {
        type: actions.ON_CHANGE_RELATION_TARGET,
        target: {
          value: 'application::address.address',
          oneThatIsCreatingARelationWithAnother: 'address',
          selectedContentTypeFriendlyName: 'address',
          targetContentTypeAllowedRelations: null,
        },
      };

      const expected = {
        ...initialState,
        modifiedData: {
          name: 'address',
          relation: 'oneToOne',
          targetAttribute: null,
          target: 'application::address.address',
          type: 'relation',
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should handle the target change correctly for the manyToMany relation', () => {
      const state = {
        ...initialState,
        modifiedData: {
          name: 'categories',
          relation: 'manyToMany',
          targetAttribute: 'addresses',
          target: 'application::category.category',
          type: 'relation',
        },
      };
      const action = {
        type: actions.ON_CHANGE_RELATION_TARGET,
        target: {
          value: 'application::country.country',
          oneThatIsCreatingARelationWithAnother: 'address',
          selectedContentTypeFriendlyName: 'country',
          targetContentTypeAllowedRelations: null,
        },
      };
      const expected = {
        ...initialState,
        modifiedData: {
          name: 'countries',
          relation: 'manyToMany',
          targetAttribute: 'addresses',
          target: 'application::country.country',
          type: 'relation',
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should handle the target change correctly if the target has restricted relations and the relation type is not correct', () => {
      const state = {
        ...initialState,
        modifiedData: {
          name: 'categories',
          relation: 'manyToMany',
          targetAttribute: 'addresses',
          target: 'application::category.category',
          type: 'relation',
        },
      };
      const action = {
        type: actions.ON_CHANGE_RELATION_TARGET,
        target: {
          value: 'application::country.country',
          oneThatIsCreatingARelationWithAnother: 'address',
          selectedContentTypeFriendlyName: 'country',
          targetContentTypeAllowedRelations: ['oneWay'],
        },
      };

      const expected = {
        ...initialState,
        modifiedData: {
          name: 'country',
          relation: 'oneToOne',
          targetAttribute: null,
          target: 'application::country.country',
          type: 'relation',
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should handle the target change correctly if the target has restricted relations and the relation type is correct', () => {
      const state = {
        ...initialState,
        modifiedData: {
          name: 'categories',
          relation: 'oneToMany',
          targetAttribute: null,
          target: 'application::category.category',
          type: 'relation',
        },
      };
      const action = {
        type: actions.ON_CHANGE_RELATION_TARGET,
        target: {
          value: 'application::country.country',
          oneThatIsCreatingARelationWithAnother: 'address',
          selectedContentTypeFriendlyName: 'country',
          targetContentTypeAllowedRelations: ['oneWay', 'manyWay'],
        },
      };

      const expected = {
        ...initialState,
        modifiedData: {
          name: 'countries',
          relation: 'oneToMany',
          targetAttribute: null,
          target: 'application::country.country',
          type: 'relation',
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });
  });

  describe('ON_CHANGE_RELATION_TYPE', () => {
    it('Should handle the relation type change correctly from oneWay to manyToMany', () => {
      const state = {
        ...initialState,
        modifiedData: {
          name: 'category test',
          relation: 'oneToOne',
          targetAttribute: null,
          target: 'application::category.category',
          type: 'relation',
        },
      };
      const action = {
        type: actions.ON_CHANGE_RELATION_TYPE,
        target: {
          value: 'manyToMany',

          oneThatIsCreatingARelationWithAnother: 'address',
        },
      };

      const expected = {
        ...initialState,
        modifiedData: {
          name: 'category_tests',
          relation: 'manyToMany',
          targetAttribute: 'addresses',
          target: 'application::category.category',
          type: 'relation',
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should handle the relation type change correctly from manyToMany to oneWay', () => {
      const state = {
        ...initialState,
        modifiedData: {
          name: 'category_tests',
          relation: 'manyToMany',
          targetAttribute: 'addresses',
          target: 'application::category.category',
          type: 'relation',
        },
      };
      const action = {
        type: actions.ON_CHANGE_RELATION_TYPE,
        target: {
          value: 'oneWay',
          oneThatIsCreatingARelationWithAnother: 'address',
        },
      };

      const expected = {
        ...initialState,
        modifiedData: {
          name: 'category_test',
          relation: 'oneToOne',
          targetAttribute: null,
          target: 'application::category.category',
          type: 'relation',
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should handle the relation type change correctly from oneToOne to oneToMany', () => {
      const state = {
        ...initialState,
        modifiedData: {
          name: 'category_test',
          relation: 'oneToOne',
          targetAttribute: 'address',
          target: 'application::category.category',
          type: 'relation',
        },
      };
      const action = {
        type: actions.ON_CHANGE_RELATION_TYPE,
        target: {
          value: 'oneToMany',
          oneThatIsCreatingARelationWithAnother: 'address',
        },
      };

      const expected = {
        ...initialState,
        modifiedData: {
          name: 'category_tests',
          relation: 'oneToMany',
          targetAttribute: 'address',
          target: 'application::category.category',
          type: 'relation',
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });
  });

  describe('RESET_PROPS', () => {
    it('Should return the initialState', () => {
      const state = { ...initialState, modifiedData: 'test' };
      const action = { type: actions.RESET_PROPS };

      expect(reducer(state, action)).toEqual(initialState);
    });
  });

  describe('RESET_PROPS_AND_SET_FORM_FOR_ADDING_AN_EXISTING_COMPO', () => {
    it('Should reset the state and update the modifiedData object with the component field basic schema', () => {
      const action = {
        type: actions.RESET_PROPS_AND_SET_FORM_FOR_ADDING_AN_EXISTING_COMPO,
      };
      const state = { ...initialState, modifiedData: 'test' };
      const expected = {
        ...initialState,
        modifiedData: {
          type: 'component',
          repeatable: true,
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });
  });

  describe('RESET_PROPS_AND_SAVE_CURRENT_DATA', () => {
    it('Should reset the state and update the modifiedData and componentToCreate objects correctly', () => {
      const action = { type: actions.RESET_PROPS_AND_SAVE_CURRENT_DATA };

      const state = {
        ...initialState,
        modifiedData: {
          type: 'component',
          createComponent: true,
          componentToCreate: {
            type: 'component',
            name: 'compo',
            icon: 'air-freshener',
            category: 'default',
          },
        },
      };

      const expected = {
        ...initialState,
        componentToCreate: {
          type: 'component',
          name: 'compo',
          icon: 'air-freshener',
          category: 'default',
        },
        modifiedData: {
          name: 'compo',
          type: 'component',
          repeatable: false,
          component: 'default.compo',
        },
        isCreatingComponentWhileAddingAField: true,
      };

      expect(reducer(state, action)).toEqual(expected);
    });
  });

  describe('RESET_PROPS_AND_SET_THE_FORM_FOR_ADDING_A_COMPO_TO_A_DZ', () => {
    it('Should reset the state and prepare the form for adding or creating a component to a dynamic zone', () => {
      const action = {
        type: actions.RESET_PROPS_AND_SET_THE_FORM_FOR_ADDING_A_COMPO_TO_A_DZ,
      };

      const state = {
        ...initialState,
        initialData: 'test',
        modifiedData: {
          type: 'dynamiczone',
          components: [],
          name: 'dz',
        },
      };

      const expected = {
        ...initialState,
        modifiedData: {
          type: 'dynamiczone',
          components: [],
          name: 'dz',
          createComponent: true,
          componentToCreate: { type: 'component' },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });
  });

  describe('SET_DATA_TO_EDIT', () => {
    it('Should set the state correctly', () => {
      const action = {
        type: actions.SET_DATA_TO_EDIT,
        data: {
          test: true,
        },
      };
      const expected = { ...initialState, modifiedData: action.data, initialData: action.data };

      expect(reducer(initialState, action)).toEqual(expected);
    });
  });

  describe('SET_ATTRIBUTE_DATA_SCHEMA', () => {
    it('Should handle the edition correcty', () => {
      const expected = {
        ...initialState,
        initialData: { test: true },
        modifiedData: { test: true },
      };
      const action = {
        type: actions.SET_ATTRIBUTE_DATA_SCHEMA,
        isEditing: true,
        modifiedDataToSetForEditing: {
          test: true,
        },
      };

      expect(reducer(initialState, action)).toEqual(expected);
    });

    it('Should set the state correctly for a component in step 1', () => {
      const action = {
        type: actions.SET_ATTRIBUTE_DATA_SCHEMA,
        attributeType: 'component',
        nameToSetForRelation: 'address',
        targetUid: 'application::address.address',
        isEditing: false,
        modifiedDataToSetForEditing: { name: null },
        step: '1',
      };
      const expected = {
        ...initialState,
        modifiedData: {
          type: 'component',
          createComponent: true,
          componentToCreate: { type: 'component' },
        },
      };

      expect(reducer(initialState, action)).toEqual(expected);
    });

    it('Should set the state correctly for a component in step 2', () => {
      const action = {
        type: actions.SET_ATTRIBUTE_DATA_SCHEMA,
        attributeType: 'component',
        nameToSetForRelation: 'address',
        targetUid: 'application::address.address',
        isEditing: false,
        modifiedDataToSetForEditing: { name: null },
        step: '2',
      };
      const expected = {
        ...initialState,
        modifiedData: {
          type: 'component',
          repeatable: true,
        },
      };

      expect(reducer(initialState, action)).toEqual(expected);
    });

    it('Should set the state correctly for a dynamiczone', () => {
      const action = {
        type: actions.SET_ATTRIBUTE_DATA_SCHEMA,
        attributeType: 'dynamiczone',
        nameToSetForRelation: 'address',
        targetUid: 'application::address.address',
        isEditing: false,
        modifiedDataToSetForEditing: { name: null },
        step: '2',
      };
      const expected = {
        ...initialState,
        modifiedData: {
          type: 'dynamiczone',
          components: [],
        },
      };

      expect(reducer(initialState, action)).toEqual(expected);
    });

    it('Should set the state correctly for a text', () => {
      const action = {
        type: actions.SET_ATTRIBUTE_DATA_SCHEMA,
        attributeType: 'text',
        nameToSetForRelation: 'address',
        targetUid: 'application::address.address',
        isEditing: false,
        modifiedDataToSetForEditing: { name: null },
        step: null,
      };
      const expected = {
        ...initialState,
        modifiedData: {
          type: 'string',
        },
      };

      expect(reducer(initialState, action)).toEqual(expected);
    });

    it('Should set the state correctly for a number', () => {
      const action = {
        type: actions.SET_ATTRIBUTE_DATA_SCHEMA,
        attributeType: 'number',
        nameToSetForRelation: 'address',
        targetUid: 'application::address.address',
        isEditing: false,
        modifiedDataToSetForEditing: { name: null },
        step: null,
      };
      const expected = { ...initialState, modifiedData: {} };

      expect(reducer(initialState, action)).toEqual(expected);
    });

    it('Should set the state correctly for a date', () => {
      const action = {
        type: actions.SET_ATTRIBUTE_DATA_SCHEMA,
        attributeType: 'date',
        nameToSetForRelation: 'address',
        targetUid: 'application::address.address',
        isEditing: false,
        modifiedDataToSetForEditing: { name: null },
        step: null,
      };
      const expected = { ...initialState, modifiedData: {} };

      expect(reducer(initialState, action)).toEqual(expected);
    });

    it('Should set the state correctly for a media', () => {
      const action = {
        type: actions.SET_ATTRIBUTE_DATA_SCHEMA,
        attributeType: 'media',
        nameToSetForRelation: 'address',
        targetUid: 'application::address.address',
        isEditing: false,
        modifiedDataToSetForEditing: { name: null },
        step: null,
      };
      const expected = {
        ...initialState,
        modifiedData: {
          type: 'media',
          multiple: true,
          allowedTypes: ['images', 'files', 'videos'],
        },
      };

      expect(reducer(initialState, action)).toEqual(expected);
    });

    it('Should set the state correctly for an enumeration', () => {
      const action = {
        type: actions.SET_ATTRIBUTE_DATA_SCHEMA,
        attributeType: 'enumeration',
        nameToSetForRelation: 'address',
        targetUid: 'application::address.address',
        isEditing: false,
        modifiedDataToSetForEditing: { name: null },
        step: null,
      };
      const expected = { ...initialState, modifiedData: { type: 'enumeration', enum: [] } };

      expect(reducer(initialState, action)).toEqual(expected);
    });

    it('Should set the state correctly for a relation', () => {
      const action = {
        type: actions.SET_ATTRIBUTE_DATA_SCHEMA,
        attributeType: 'relation',
        nameToSetForRelation: 'address test',
        targetUid: 'application::address.address',
        isEditing: false,
        modifiedDataToSetForEditing: { name: null },
        step: null,
      };
      const expected = {
        ...initialState,
        modifiedData: {
          name: 'address_test',
          relation: 'oneToOne',
          targetAttribute: null,
          target: 'application::address.address',
          type: 'relation',
        },
      };

      expect(reducer(initialState, action)).toEqual(expected);
    });

    it('Should set the state correctly for the other cases', () => {
      const action = {
        type: actions.SET_ATTRIBUTE_DATA_SCHEMA,
        attributeType: 'json',
        nameToSetForRelation: 'address',
        targetUid: 'application::address.address',
        isEditing: false,
        modifiedDataToSetForEditing: { name: null },
        step: null,
      };
      const expected = { ...initialState, modifiedData: { type: 'json', default: null } };

      expect(reducer(initialState, action)).toEqual(expected);
    });
  });

  describe('SET_DYNAMIC_ZONE_DATA_SCHEMA', () => {
    it('Should set the dynamic zone schema correctly', () => {
      const action = {
        type: actions.SET_DYNAMIC_ZONE_DATA_SCHEMA,
        attributeToEdit: {
          type: 'dynamiczone',
          components: [],
          name: 'dz',
          createComponent: false,
          componentToCreate: { type: 'component' },
        },
      };
      const expected = {
        ...initialState,
        modifiedData: action.attributeToEdit,
        initialData: action.attributeToEdit,
      };

      expect(reducer(initialState, action)).toEqual(expected);
    });
  });

  describe('SET_ERRORS', () => {
    it('Should set the formErrors object correctly', () => {
      const action = {
        type: actions.SET_ERRORS,
        errors: {
          test: 'this is required',
        },
      };
      const expected = { ...initialState, formErrors: action.errors };

      expect(reducer(initialState, action)).toEqual(expected);
    });
  });

  describe('Default', () => {
    it('Should return the initialState', () => {
      const action = { type: 'DUMMY' };

      expect(reducer(initialState, action)).toEqual(initialState);
    });
  });
});
