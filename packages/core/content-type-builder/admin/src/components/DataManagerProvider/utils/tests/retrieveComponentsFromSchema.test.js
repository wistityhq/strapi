import retrieveComponentsFromSchema from '../retrieveComponentsFromSchema';

describe('CONTENT TYPE BUILDER | components | DataManagerProvider | utils | retrieveComponentsFromSchema', () => {
  it('should return an array of components name', () => {
    const attributes = [
      {
        maxLength: 50,
        required: true,
        minLength: 5,
        type: 'string',
        pluginOptions: {},
        name: 'name',
      },
      { type: 'uid', targetField: 'name', pluginOptions: {}, name: 'slug' },

      {
        type: 'relation',
        relation: 'oneToOne',
        target: 'application::address.address',
        targetAttribute: null,
        private: false,
        name: 'address',
      },

      {
        type: 'relation',
        relation: 'oneToOne',
        target: 'application::menu.menu',
        inversedBy: 'restaurant',
        targetAttribute: 'restaurant',
        private: false,
        name: 'menu',
      },
      {
        component: 'default.openingtimes',
        type: 'component',
        repeatable: true,
        min: 1,
        max: 10,
        pluginOptions: {},
        name: 'opening_times',
      },
      {
        type: 'dynamiczone',
        components: ['default.restaurantservice'],
        pluginOptions: {},
        name: 'dz',
      },
    ];

    const components = {
      'blog.test-como': {
        uid: 'blog.test-como',
        category: 'blog',
        apiId: 'test-como',
        schema: {
          icon: 'ad',
          name: 'test comp',
          description: '',
          collectionName: 'components_blog_test_comos',
          attributes: [{ type: 'string', name: 'name' }],
        },
      },
      'default.closingperiod': {
        uid: 'default.closingperiod',
        category: 'default',
        apiId: 'closingperiod',
        schema: {
          icon: 'angry',
          name: 'closingperiod',
          description: '',
          collectionName: 'components_closingperiods',
          attributes: [
            { type: 'string', name: 'label' },
            { type: 'date', required: true, name: 'start_date' },
            { type: 'date', required: true, name: 'end_date' },
            { type: 'media', multiple: false, required: false, name: 'media' },
            { component: 'default.dish', type: 'component', name: 'dish' },
          ],
        },
      },
      'default.dish': {
        uid: 'default.dish',
        category: 'default',
        apiId: 'dish',
        schema: {
          icon: 'address-book',
          name: 'dish',
          description: '',
          collectionName: 'components_dishes',
          attributes: [
            { type: 'string', required: false, default: 'My super dish', name: 'name' },
            { type: 'text', name: 'description' },
            { type: 'float', name: 'price' },
            { type: 'media', multiple: false, required: false, name: 'picture' },
            { type: 'richtext', name: 'very_long_description' },
            {
              type: 'relation',
              relation: 'oneToOne',
              target: 'application::category.category',
              targetAttribute: null,
              private: false,
              name: 'categories',
            },
          ],
        },
      },
      'default.openingtimes': {
        uid: 'default.openingtimes',
        category: 'default',
        apiId: 'openingtimes',
        schema: {
          icon: 'calendar',
          name: 'openingtimes',
          description: '',
          collectionName: 'components_openingtimes',
          attributes: [
            { type: 'string', required: true, default: 'something', name: 'label' },
            { type: 'string', name: 'time' },
            { type: 'component', repeatable: true, component: 'default.dish', name: 'dishrep' },
          ],
        },
      },
      'default.restaurantservice': {
        uid: 'default.restaurantservice',
        category: 'default',
        apiId: 'restaurantservice',
        schema: {
          icon: 'cannabis',
          name: 'restaurantservice',
          description: '',
          collectionName: 'components_restaurantservices',
          attributes: [
            { type: 'string', required: true, default: 'something', name: 'name' },
            { type: 'media', multiple: false, required: false, name: 'media' },
            { type: 'boolean', required: true, default: true, name: 'is_available' },
          ],
        },
      },
    };

    const expected = ['default.openingtimes', 'default.dish', 'default.restaurantservice'];

    expect(retrieveComponentsFromSchema(attributes, components)).toEqual(expected);
  });
});
