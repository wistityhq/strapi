import {
  doesComponentHaveAComponentField,
  retrieveComponentsThatHaveComponents,
} from '../retrieveComponentsThatHaveComponents';

const data = {
  // Slider has a component
  'blog.slider': {
    uid: 'blog.slider',
    category: 'blog',
    schema: {
      icon: 'atom',
      name: 'slider',
      description: '',
      connection: 'default',
      collectionName: 'components_sliders',
      attributes: [
        { type: 'string', required: true, name: 'title' },
        {
          name: 'slide',
          component: 'default.slide',
          type: 'component',
          repeatable: true,
          min: 1,
          max: 5,
        },
      ],
    },
  },
  'default.dish': {
    uid: 'default.dish',
    category: 'default',
    schema: {
      icon: 'beer',
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
          name: 'address',
          relation: 'oneToOne',
          target: 'application::address.address',
          type: 'relation',
        },
        {
          name: 'addresses',
          relation: 'oneToMany',
          target: 'application::address.address',
          type: 'relation',
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
      ],
    },
  },
};

describe('retrieveComponentsThatHaveComponents', () => {
  describe('doesComponentHaveAComponentField', () => {
    it('Should return true if one of its attributes is a component', () => {
      expect(doesComponentHaveAComponentField(data['blog.slider'])).toBe(true);
    });

    it('Should return false if none of its attributes is a component', () => {
      expect(doesComponentHaveAComponentField(data['default.dish'])).toBe(false);
    });
  });

  describe('retrievComponentsThatHaveComponents', () => {
    it('should return an array with all the components that have nested components', () => {
      expect(retrieveComponentsThatHaveComponents(data)).toEqual(['blog.slider']);
    });
  });
});
