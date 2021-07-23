'use strict';
const category = {
  modelName: 'category',
  uid: 'category',
  collectionName: 'categories',
  attributes: {
    title: {
      type: 'string',
    },
    price: {
      type: 'integer',
      //
      column: {
        // unique: true,
        nonNullable: true,
        unsigned: true,
        defaultTo: 12.0,
      },
    },
    articles: {
      type: 'relation',
      relation: 'oneToMany',
      target: 'article',
      mappedBy: 'category',
    },
    compo: {
      type: 'component',
      component: 'compo',
    },
  },
};

const article = {
  modelName: 'article',
  uid: 'article',
  collectionName: 'articles',
  attributes: {
    title: {
      type: 'string',
    },
    category: {
      type: 'relation',
      relation: 'manyToOne',
      target: 'category',
      inversedBy: 'articles',
      // useJoinTable: false,
    },
    // tags: {
    //   type: 'relation',
    //   relation: 'manyToMany',
    //   target: 'tag',
    //   inversedBy: 'articles',
    // },
    // compo: {
    //   type: 'component',
    //   component: 'compo',
    //   // repeatable: true,
    // },
    // cover: {
    //   type: 'media',
    //   single: true,
    // },
    // gallery: {
    //   type: 'media',
    //   multiple: true,
    // },
  },
};

const tags = {
  modelName: 'tag',
  uid: 'tag',
  collectionName: 'tags',
  attributes: {
    name: {
      type: 'string',
    },
    articles: {
      type: 'relation',
      relation: 'manyToMany',
      target: 'article',
      mappedBy: 'tag',
    },
  },
};

const compo = {
  modelName: 'compo',
  uid: 'compo',
  collectionName: 'compos',
  attributes: {
    key: {
      type: 'string',
    },
    value: {
      type: 'string',
    },
  },
};

const user = {
  modelName: 'user',
  uid: 'user',
  collectionName: 'users',
  attributes: {
    address: {
      type: 'relation',
      relation: 'oneToOne',
      target: 'address',
      inversedBy: 'user',
      // useJoinTable: false,
    },
  },
};

const address = {
  modelName: 'address',
  uid: 'address',
  collectionName: 'addresses',
  attributes: {
    name: {
      type: 'string',
    },
    user: {
      type: 'relation',
      relation: 'oneToOne',
      target: 'user',
      mappedBy: 'address',
    },
  },
};

const file = {
  modelName: 'file',
  uid: 'file',
  collectionName: 'files',
  attributes: {
    name: {
      type: 'string',
    },
    alternativeText: {
      type: 'string',
    },
    caption: {
      type: 'string',
    },
    width: {
      type: 'integer',
    },
    height: {
      type: 'integer',
    },
    formats: {
      type: 'json',
    },
    hash: {
      type: 'string',
    },
    ext: {
      type: 'string',
    },
    mime: {
      type: 'string',
    },
    size: {
      type: 'decimal',
    },
    url: {
      type: 'string',
    },
    previewUrl: {
      type: 'string',
    },
    provider: {
      type: 'string',
    },
    provider_metadata: {
      type: 'json',
    },
    // related: {
    //   type: 'relation',
    //   relation: 'oneToMany',
    //   target: 'file_morph',
    //   mappedBy: 'file',
    // },
    // related: {
    //   type: 'relation',
    //   realtion: 'morphTo',
    // },
  },
};

const fileMorph = {
  modelName: 'file-morph',
  uid: 'file-morph',
  collectionName: 'file_morphs',
  attributes: {
    // file: {
    //   type: 'relation',
    //   relation: 'manyToOne',
    //   target: 'file',
    //   inversedBy: 'related',
    //   useJoinTable: false,
    // },
  },
};

const blogPost = {
  modelName: 'blogPost',
  uid: 'blogPost',
  collectionName: 'blog_posts',
  attributes: {
    passwordField: {
      type: 'password',
    },
    emailField: {
      type: 'email',
    },
    stringField: {
      type: 'string',
    },
    uidField: {
      type: 'uid',
    },
    richtextField: {
      type: 'richtext',
    },
    textField: {
      type: 'text',
    },
    enumerationField: {
      type: 'enumeration',
      enum: ['A', 'B'],
    },
    jsonField: {
      type: 'json',
    },
    bigintegerField: {
      type: 'biginteger',
    },
    integerField: {
      type: 'integer',
    },
    floatField: {
      type: 'float',
    },
    decimalField: {
      type: 'decimal',
    },
    dateField: {
      type: 'date',
    },
    timeField: {
      type: 'time',
    },
    datetimeField: {
      type: 'datetime',
    },
    timestampField: {
      type: 'timestamp',
    },
    booleanField: {
      type: 'boolean',
    },
  },
};

module.exports = [category, article, tags, compo, user, address, file, fileMorph, blogPost];
