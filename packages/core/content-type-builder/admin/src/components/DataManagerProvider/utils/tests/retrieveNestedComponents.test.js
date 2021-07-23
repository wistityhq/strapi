import retrieveNestedComponents from '../retrieveNestedComponents';

describe('CONTENT TYPE BUILDER | COMPONENTS | DataManagerProvider | utils | retrieveNestedComponents', () => {
  it('should return an array of nested components', () => {
    const components = {
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
    };

    const expected = ['default.dish'];

    expect(retrieveNestedComponents(components)).toEqual(expected);
  });
});
