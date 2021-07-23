const expectedData = {
  contentTypeToCreate: {
    name: 'test content type',
    collectionName: 'test-content-types',
    connection: 'default',
    description: '',
    attributes: {
      name: {
        type: 'string',
      },
      address: {
        relation: 'oneToOne',
        target: 'application::address.address',
        // targetAttribute: null,
        type: 'relation',
      },
      testContentTypes: {
        relation: 'oneToMany',
        targetAttribute: 'testContentType',
        target: '__self__',
        type: 'relation',
      },
      testContentType: {
        relation: 'manyToOne',
        target: '__self__',
        targetAttribute: 'testContentTypes',
        type: 'relation',
      },
      mainCompoField: {
        type: 'component',
        repeatable: false,
        component: 'components.main-compo',
      },
      existingCompo: {
        type: 'component',
        repeatable: true,
        component: 'default.metas',
      },
      quote: {
        type: 'component',
        repeatable: false,
        component: 'blog.quote',
      },
    },
  },
  contentTypeToEdit: {
    name: 'test content type',
    collectionName: 'test-content-types',
    connection: 'default',
    description: '',
    attributes: {
      name: {
        type: 'string',
      },
      address: {
        relation: 'oneToOne',
        target: 'application::address.address',
        type: 'relation',
      },
      testContentTypes: {
        relation: 'oneToMany',
        targetAttribute: 'testContentType',
        target: 'application::test-content-type.test-content-type',
        type: 'relation',
      },
      testContentType: {
        relation: 'manyToOne',
        target: 'application::test-content-type.test-content-type',
        targetAttribute: 'testContentTypes',
        type: 'relation',
      },
      mainCompoField: {
        type: 'component',
        repeatable: false,
        component: 'components.main-compo',
      },
      existingCompo: {
        type: 'component',
        repeatable: true,
        component: 'default.metas',
      },
      quote: {
        type: 'component',
        repeatable: false,
        component: 'blog.quote',
      },
    },
  },
  componentsToFormat: ['components.main-compo', 'default.nested-compo', 'blog.quote'],
  sortedContentTypes: [
    {
      uid: 'plugins::myplugins.atest',
      name: 'plugins::myplugins.atest',
      title: 'plugins::myplugins.atest',
      to: '/plugins/content-type-builder/content-types/plugins::myplugins.atest',
      kind: 'collectionType',
      visible: true,
      plugin: null,
      restrictRelationsTo: [],
    },
    {
      uid: 'plugins::myplugins.btest',
      name: 'plugins::myplugins.btest',
      title: 'plugins::myplugins.btest',
      to: '/plugins/content-type-builder/content-types/plugins::myplugins.btest',
      kind: 'collectionType',
      visible: true,
      plugin: null,
      restrictRelationsTo: null,
    },
    {
      uid: 'plugins::myplugins.ctest',
      name: 'plugins::myplugins.ctest',
      title: 'plugins::myplugins.ctest',
      to: '/plugins/content-type-builder/content-types/plugins::myplugins.ctest',
      kind: 'collectionType',
      visible: true,
      plugin: null,
      restrictRelationsTo: ['oneWay'],
    },
    {
      uid: 'plugins::myplugins.test',
      name: 'plugins::myplugins.test',
      title: 'plugins::myplugins.test',
      to: '/plugins/content-type-builder/content-types/plugins::myplugins.test',
      kind: 'singleType',
      visible: true,
      plugin: null,
      restrictRelationsTo: null,
    },
  ],

  components: [
    {
      tmpUID: 'components.main-compo',
      name: 'mainCompo',
      icon: 'ad',
      category: 'components',
      attributes: {
        name: {
          type: 'string',
        },
        testContentType: {
          relation: 'oneToOne',
          target: '__contentType__',
          type: 'relation',
        },
        subCompoField: {
          type: 'component',
          repeatable: false,
          component: 'default.nested-compo',
        },
      },
    },
    {
      tmpUID: 'default.nested-compo',
      name: 'nestedCompo',
      icon: 'address-book',
      category: 'default',
      attributes: {
        name: {
          type: 'string',
        },
        email: {
          type: 'email',
        },
      },
    },
    {
      uid: 'blog.quote',
      category: 'blog',
      name: 'quote',
      description: '',
      icon: 'anchor',
      connection: 'default',
      collectionName: 'components_quotes',
      attributes: {
        quote: {
          type: 'string',
          required: true,
        },

        link_to_biography: {
          type: 'string',
          required: true,
        },
      },
    },
  ],
  componentsForEdit: [
    {
      tmpUID: 'components.main-compo',
      name: 'mainCompo',
      icon: 'ad',
      category: 'components',
      attributes: {
        name: {
          type: 'string',
        },
        testContentType: {
          relation: 'oneToOne',
          target: 'application::test-content-type.test-content-type',
          type: 'relation',
        },
        subCompoField: {
          type: 'component',
          repeatable: false,
          component: 'default.nested-compo',
        },
      },
    },
    {
      tmpUID: 'default.nested-compo',
      name: 'nestedCompo',
      icon: 'address-book',
      category: 'default',
      attributes: {
        name: {
          type: 'string',
        },
        email: {
          type: 'email',
        },
      },
    },
    {
      uid: 'blog.quote',
      category: 'blog',
      name: 'quote',
      description: '',
      icon: 'anchor',
      connection: 'default',
      collectionName: 'components_quotes',
      attributes: {
        quote: {
          type: 'string',
          required: true,
        },
        link_to_biography: {
          type: 'string',
          required: true,
        },
      },
    },
  ],
  formattedComponents: {
    'components.main-compo': {
      tmpUID: 'components.main-compo',
      name: 'mainCompo',
      icon: 'ad',
      category: 'components',
      attributes: {
        name: {
          type: 'string',
        },
        testContentType: {
          relation: 'oneToOne',
          target: '__contentType__',
          type: 'relation',
        },
        subCompoField: {
          type: 'component',
          repeatable: false,
          component: 'default.nested-compo',
        },
      },
    },
    'default.nested-compo': {
      tmpUID: 'default.nested-compo',
      name: 'nestedCompo',
      icon: 'address-book',
      category: 'default',
      attributes: {
        name: {
          type: 'string',
        },
        email: {
          type: 'email',
        },
      },
    },
    'blog.quote': {
      uid: 'blog.quote',
      category: 'blog',
      name: 'quote',
      description: '',
      icon: 'anchor',
      connection: 'default',
      collectionName: 'components_quotes',
      attributes: {
        quote: {
          type: 'string',
          required: true,
        },
        link_to_biography: {
          type: 'string',
          required: true,
        },
      },
    },
  },
  formattedComponentsForEdit: {
    'components.main-compo': {
      tmpUID: 'components.main-compo',
      name: 'mainCompo',
      icon: 'ad',
      category: 'components',
      attributes: {
        name: {
          type: 'string',
        },
        testContentType: {
          relation: 'oneToOne',
          target: 'application::test-content-type.test-content-type',
          type: 'relation',
        },
        subCompoField: {
          type: 'component',
          repeatable: false,
          component: 'default.nested-compo',
        },
      },
    },
    'default.nested-compo': {
      tmpUID: 'default.nested-compo',
      name: 'nestedCompo',
      icon: 'address-book',
      category: 'default',
      attributes: {
        name: {
          type: 'string',
        },
        email: {
          type: 'email',
        },
      },
    },
    'blog.quote': {
      uid: 'blog.quote',
      category: 'blog',
      name: 'quote',
      description: '',
      icon: 'anchor',
      connection: 'default',
      collectionName: 'components_quotes',
      attributes: {
        quote: {
          type: 'string',
          required: true,
        },
        link_to_biography: {
          type: 'string',
          required: true,
        },
      },
    },
  },
};

export default expectedData;
