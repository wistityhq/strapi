const data = {
  homeSingleType: {
    contentType: {
      uid: 'plugins::myplugins.home',
      schema: {
        name: 'plugins::myplugins.home',
        kind: 'singleType',
        attributes: [
          {
            name: 'category',
            type: 'relation',
            relation: 'oneToOne',
            targetAttribute: null,
            target: 'category',
          },
          { name: 'address', type: 'string' },
        ],
      },
    },
  },
  articleContentType: {
    contentType: {
      uid: 'plugins::myplugins.article',
      schema: {
        name: 'plugins::myplugins.article',
        kind: 'collectionType',
        attributes: [
          {
            name: 'user',
            relation: 'manyToOne',
            type: 'relation',
            target: 'user',
            targetAttribute: 'article',
          },
          { name: 'category', type: 'string' },
        ],
      },
    },
  },
  postContentType: {
    contentType: {
      uid: 'plugins::myplugins.post',
      schema: {
        name: 'plugins::myplugins.post',
        kind: 'collectionType',
        attributes: [
          {
            relation: 'oneToMany',
            targetAttribute: null,
            type: 'relation',
            target: 'user',
            name: 'user',
          },
          { type: 'string', name: 'title' },
        ],
      },
    },
  },
};

export default data;
