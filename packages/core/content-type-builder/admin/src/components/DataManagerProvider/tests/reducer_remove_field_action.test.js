import reducer, { initialState } from '../reducer';
import testData from './data';
import { REMOVE_FIELD } from '../constants';

describe('CTB | components | DataManagerProvider | reducer | REMOVE_FIELD', () => {
  describe('Removing a field that is not a relation', () => {
    it('Should remove the attribute correctly from the content type', () => {
      const action = {
        type: REMOVE_FIELD,
        mainDataKey: 'contentType',
        attributeToRemoveName: 'city',
        componentUid: '',
      };

      const state = {
        ...initialState,
        contentTypes: testData.contentTypes,
        initialContentTypes: testData.contentTypes,
        modifiedData: {
          components: {},
          contentType: {
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
          },
        },
      };

      const expected = {
        ...state,
        modifiedData: {
          components: {},
          contentType: {
            uid: 'application::address.address',
            schema: {
              name: 'address',
              description: '',
              connection: 'default',
              collectionName: '',
              attributes: [
                { name: 'geolocation', type: 'json', required: true },

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
          },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });
  });

  describe('Removing a relation attribute with another content type', () => {
    it('Should remove the attribute correctly if the relation is made with another content type', () => {
      const attributeToRemoveName = 'menu';
      const action = {
        type: REMOVE_FIELD,
        mainDataKey: 'contentType',
        attributeToRemoveName,
        componentUid: '',
      };

      const state = {
        ...initialState,
        contentTypes: testData.contentTypes,
        initialContentTypes: testData.contentTypes,
        modifiedData: {
          components: {},
          contentType: {
            uid: 'application::menusection.menusection',
            schema: {
              name: 'menusection',
              description: '',
              connection: 'default',
              collectionName: '',
              attributes: [
                { name: 'name', type: 'string', required: true, minLength: 6 },
                {
                  name: 'dishes',
                  component: 'default.dish',
                  type: 'component',
                  repeatable: true,
                },
                {
                  name: 'menu',
                  relation: 'manyToOne',
                  target: 'application::menu.menu',
                  targetAttribute: 'menusections',
                  type: 'relation',
                },
              ],
            },
          },
        },
      };

      const expected = {
        ...initialState,
        contentTypes: testData.contentTypes,
        initialContentTypes: testData.contentTypes,
        modifiedData: {
          components: {},
          contentType: {
            uid: 'application::menusection.menusection',
            schema: {
              name: 'menusection',
              description: '',
              connection: 'default',
              collectionName: '',
              attributes: [
                { name: 'name', type: 'string', required: true, minLength: 6 },
                {
                  name: 'dishes',
                  component: 'default.dish',
                  type: 'component',
                  repeatable: true,
                },
              ],
            },
          },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });
  });

  describe('Removing a relation attribute with the same content type', () => {
    it('Should handle the removal of the one side (oneWay or manyWay) nature correctly', () => {
      const contentTypeUID = 'application::dummy.dummy';

      const action = {
        type: REMOVE_FIELD,
        mainDataKey: 'contentType',
        attributeToRemoveName: 'one_way_attr',
        componentUid: '',
      };
      const contentType = {
        uid: contentTypeUID,
        schema: {
          name: 'dummy',
          attributes: [
            { name: 'name', type: 'string' },
            {
              name: 'one_way_attr',
              relation: 'oneToOne',
              target: contentTypeUID,
              type: 'relation',
            },
            {
              name: 'many_way_attrs',
              relation: 'oneToMany',
              target: contentTypeUID,
              type: 'relation',
            },
            {
              name: 'one_to_many_left',
              relation: 'oneToMany',
              targetAttribute: 'one_to_many_right',
              target: contentTypeUID,
              type: 'relation',
            },
            {
              name: 'one_to_many_right',
              relation: 'manyToOne',
              target: 'application::dummy.dummy',
              targetAttribute: 'one_to_many_left',
              type: 'relation',
            },
          ],
        },
      };

      const expectedContentType = {
        uid: contentTypeUID,
        schema: {
          name: 'dummy',
          attributes: [
            { name: 'name', type: 'string' },
            {
              name: 'many_way_attrs',
              relation: 'oneToMany',
              target: contentTypeUID,
              type: 'relation',
            },
            {
              name: 'one_to_many_left',
              relation: 'oneToMany',
              targetAttribute: 'one_to_many_right',
              target: contentTypeUID,
              type: 'relation',
            },
            {
              name: 'one_to_many_right',
              relation: 'manyToOne',
              target: 'application::dummy.dummy',
              targetAttribute: 'one_to_many_left',
              type: 'relation',
            },
          ],
        },
      };

      const state = {
        ...initialState,
        contentTypes: {
          [contentTypeUID]: contentType,
        },
        modifiedData: {
          components: {},
          contentType,
        },
      };

      const expected = {
        ...initialState,
        contentTypes: {
          [contentTypeUID]: contentType,
        },
        modifiedData: {
          components: {},
          contentType: expectedContentType,
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });

    it('Should handle the removal of the two sides (oneToOne, oneToMany, manyToOne, manyToMany) nature correctly', () => {
      const contentTypeUID = 'application::dummy.dummy';
      const action = {
        type: REMOVE_FIELD,
        mainDataKey: 'contentType',
        attributeToRemoveName: 'one_to_many_left',
        componentUid: '',
      };
      const contentType = {
        uid: contentTypeUID,
        schema: {
          name: 'dummy',
          attributes: [
            { name: 'name', type: 'string' },
            {
              name: 'one_way_attr',
              relation: 'oneToOne',
              target: contentTypeUID,
              type: 'relation',
            },
            {
              name: 'many_way_attrs',
              relation: 'oneToMany',
              target: contentTypeUID,
              type: 'relation',
            },
            {
              name: 'one_to_many_left',
              relation: 'oneToMany',
              targetAttribute: 'one_to_many_right',
              target: contentTypeUID,
              type: 'relation',
            },
            {
              name: 'one_to_many_right',
              relation: 'manyToOne',
              target: 'application::dummy.dummy',
              targetAttribute: 'one_to_many_left',
              type: 'relation',
            },
          ],
        },
      };

      const expectedContentType = {
        uid: contentTypeUID,
        schema: {
          name: 'dummy',
          attributes: [
            { name: 'name', type: 'string' },
            {
              name: 'one_way_attr',
              relation: 'oneToOne',
              target: contentTypeUID,
              type: 'relation',
            },
            {
              name: 'many_way_attrs',
              relation: 'oneToMany',
              target: contentTypeUID,
              type: 'relation',
            },
          ],
        },
      };

      const state = {
        ...initialState,
        contentTypes: { [contentTypeUID]: contentType },
        modifiedData: {
          components: {},
          contentType,
        },
      };

      const expected = {
        ...initialState,
        contentTypes: { [contentTypeUID]: contentType },
        modifiedData: {
          components: {},
          contentType: expectedContentType,
        },
      };

      expect(reducer(state, action)).toEqual(expected);
      expect(
        reducer(state, {
          ...action,
          attributeToRemoveName: 'one_to_many_right',
        })
      ).toEqual(expected);
    });
  });

  describe('Removing a field that is targeted by a UID field', () => {
    it('Should remove the attribute correctly and remove the targetField from the UID field', () => {
      const attributeToRemoveName = 'description';
      const action = {
        type: REMOVE_FIELD,
        mainDataKey: 'contentType',
        attributeToRemoveName,
        componentUid: '',
      };

      const state = {
        ...initialState,
        contentTypes: testData.contentTypes,
        initialContentTypes: testData.contentTypes,
        modifiedData: {
          components: {},
          contentType: {
            uid: 'application::homepage.homepage',
            schema: {
              name: 'homepage',
              attributes: [
                { name: 'title', type: 'string' },
                { name: 'homepageuidfield', type: 'uid', targetField: 'description' },
                { name: 'description', type: 'string' },
                { name: 'other_uid_field', type: 'uid', targetField: 'description' },
              ],
            },
          },
        },
      };

      const expected = {
        ...initialState,
        contentTypes: testData.contentTypes,
        initialContentTypes: testData.contentTypes,
        modifiedData: {
          components: {},
          contentType: {
            uid: 'application::homepage.homepage',
            schema: {
              name: 'homepage',
              attributes: [
                { name: 'title', type: 'string' },
                { name: 'homepageuidfield', type: 'uid' },
                { name: 'other_uid_field', type: 'uid' },
              ],
            },
          },
        },
      };

      expect(reducer(state, action)).toEqual(expected);
    });
  });
});
