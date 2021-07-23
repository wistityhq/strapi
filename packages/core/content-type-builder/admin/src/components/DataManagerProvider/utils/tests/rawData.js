const data = {
  initialComponents: {
    'default.metas': {
      uid: 'default.metas',
      category: 'default',
      schema: {
        icon: 'angry',
        name: 'metas',
        description: '',
        connection: 'default',
        collectionName: 'components_metas',
        attributes: [
          {
            name: 'meta',
            type: 'string',
            required: true,
            default: 'title',
          },
          {
            name: 'value',
            type: 'text',
            required: true,
            default: 'A title',
          },
        ],
      },
    },
    'blog.quote': {
      uid: 'blog.quote',
      category: 'blog',
      schema: {
        name: 'quote',
        description: '',
        icon: 'anchor',
        connection: 'default',
        collectionName: 'components_quotes',
        attributes: [
          {
            name: 'quote',
            type: 'text',
            required: true,
          },

          {
            name: 'link_to_biography',
            type: 'string',
            required: true,
          },
        ],
      },
    },
  },
  rawData: {
    components: {
      'components.main-compo': {
        uid: 'components.main-compo',
        isTemporary: true,
        category: 'components',
        schema: {
          name: 'mainCompo',
          icon: 'ad',
          attributes: [
            {
              name: 'name',
              type: 'string',
            },
            {
              name: 'testContentType',
              relation: 'oneToOne',
              targetAttribute: null,
              target: 'application::test-content-type.test-content-type',
              type: 'relation',
            },
            {
              name: 'subCompoField',
              type: 'component',
              repeatable: false,
              component: 'default.nested-compo',
            },
          ],
        },
      },
      'default.nested-compo': {
        uid: 'default.nested-compo',
        isTemporary: true,
        category: 'default',
        schema: {
          name: 'nestedCompo',
          icon: 'address-book',
          attributes: [
            {
              name: 'name',
              type: 'string',
            },
            {
              name: 'email',
              type: 'email',
              default: null,
            },
          ],
        },
      },
      'default.metas': {
        uid: 'default.metas',
        category: 'default',
        schema: {
          icon: 'angry',
          name: 'metas',
          description: '',
          connection: 'default',
          collectionName: 'components_metas',
          attributes: [
            {
              name: 'meta',
              type: 'string',
              required: true,
              default: 'title',
            },
            {
              name: 'value',
              type: 'text',
              required: true,
              default: 'A title',
            },
          ],
        },
      },
      'blog.quote': {
        uid: 'blog.quote',
        category: 'blog',
        schema: {
          name: 'quote',
          description: '',
          icon: 'anchor',
          connection: 'default',
          collectionName: 'components_quotes',
          attributes: [
            {
              name: 'quote',
              type: 'string',
              required: true,
            },
            {
              name: 'link_to_biography',
              type: 'string',
              required: true,
            },
          ],
        },
      },
    },
    contentTypesToSort: {
      'plugins::myplugins.test': {
        uid: 'plugins::myplugins.test',
        schema: {
          name: 'plugins::myplugins.test',
          kind: 'singleType',
          visible: true,
          restrictRelationsTo: null,
        },
      },
      'plugins::myplugins.btest': {
        uid: 'plugins::myplugins.btest',
        schema: {
          name: 'plugins::myplugins.btest',
          kind: 'collectionType',
          visible: true,
          restrictRelationsTo: null,
        },
      },
      'plugins::myplugins.atest': {
        uid: 'plugins::myplugins.atest',
        schema: {
          name: 'plugins::myplugins.atest',
          kind: 'collectionType',
          visible: true,
          restrictRelationsTo: [],
        },
      },
      'plugins::myplugins.ctest': {
        uid: 'plugins::myplugins.ctest',
        schema: {
          name: 'plugins::myplugins.ctest',
          kind: 'collectionType',
          visible: true,
          restrictRelationsTo: ['oneWay'],
        },
      },
    },

    contentTypeToCreate: {
      uid: 'application::test-content-type.test-content-type',
      isTemporary: true,
      schema: {
        name: 'test content type',
        collectionName: 'test-content-types',
        connection: 'default',
        description: '',
        attributes: [
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'address',
            relation: 'oneToOne',
            targetAttribute: null,
            target: 'application::address.address',
            type: 'relation',
          },
          {
            name: 'testContentTypes',
            relation: 'oneToMany',
            targetAttribute: 'testContentType',
            target: 'application::test-content-type.test-content-type',
            type: 'relation',
          },
          {
            name: 'testContentType',
            relation: 'manyToOne',
            target: 'application::test-content-type.test-content-type',
            targetAttribute: 'testContentTypes',
            type: 'relation',
          },
          {
            name: 'mainCompoField',
            type: 'component',
            repeatable: false,
            component: 'components.main-compo',
          },
          {
            name: 'existingCompo',
            type: 'component',
            repeatable: true,
            component: 'default.metas',
          },
          {
            name: 'quote',
            type: 'component',
            repeatable: false,
            component: 'blog.quote',
          },
        ],
      },
    },
    contentTypeToEdit: {
      uid: 'application::test-content-type.test-content-type',
      schema: {
        name: 'test content type',
        collectionName: 'test-content-types',
        connection: 'default',
        description: '',
        attributes: [
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'address',
            relation: 'oneToOne',
            targetAttribute: null,
            target: 'application::address.address',
            type: 'relation',
          },
          {
            name: 'testContentTypes',
            relation: 'oneToMany',
            targetAttribute: 'testContentType',
            target: 'application::test-content-type.test-content-type',
            type: 'relation',
          },
          {
            name: 'testContentType',
            relation: 'manyToOne',
            target: 'application::test-content-type.test-content-type',
            targetAttribute: 'testContentTypes',
            type: 'relation',
          },
          {
            name: 'mainCompoField',
            type: 'component',
            repeatable: false,
            component: 'components.main-compo',
          },
          {
            name: 'existingCompo',
            type: 'component',
            repeatable: true,
            component: 'default.metas',
          },
          {
            name: 'quote',
            type: 'component',
            repeatable: false,
            component: 'blog.quote',
          },
        ],
      },
    },
  },
};

export default data;
