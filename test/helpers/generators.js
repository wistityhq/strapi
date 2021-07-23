'use strict';

module.exports = {
  article: {
    attributes: {
      title: {
        type: 'string',
      },
      date: {
        type: 'date',
      },
      jsonField: {
        type: 'json',
      },
      content: {
        type: 'richtext',
      },
      author: {
        type: 'relation',
        relation: 'manyToOne',
        target: 'plugins::users-permissions.user',
        targetAttribute: 'articles',
      },
    },
    uid: 'application::article.article',
    name: 'article',
    description: '',
    collectionName: '',
  },
  tag: {
    attributes: {
      name: {
        type: 'string',
      },
      articles: {
        type: 'relation',
        relation: 'manyToMany',
        target: 'application::article.article',
        targetAttribute: 'tags',
      },
    },
    uid: 'application::tag.tag',
    name: 'tag',
    description: '',
    collectionName: '',
  },
  category: {
    attributes: {
      name: {
        type: 'string',
      },
      articles: {
        type: 'relation',
        relation: 'oneToMany',
        target: 'application::article.article',
        targetAttribute: 'category',
      },
    },
    uid: 'application::category.category',
    name: 'category',
    description: '',
    collectionName: '',
  },
  reference: {
    attributes: {
      name: {
        type: 'string',
      },
      article: {
        type: 'relation',
        relation: 'oneToOne',
        target: 'application::article.article',
        targetAttribute: 'reference',
      },
      tag: {
        type: 'relation',
        relation: 'oneToOne',
        target: 'application::tag.tag',
      },
    },
    uid: 'application::reference.reference',
    name: 'reference',
    description: '',
    collectionName: 'refs',
  },
  product: {
    attributes: {
      name: {
        type: 'string',
      },
      description: {
        type: 'richtext',
      },
      published: {
        type: 'boolean',
      },
    },
    uid: 'application::product.product',
    name: 'product',
    description: '',
    collectionName: '',
  },
  articlewithtag: {
    attributes: {
      title: {
        type: 'string',
      },
      tags: {
        type: 'relation',
        relation: 'oneToMany',
        target: 'application::tag.tag',
      },
    },
    uid: 'application::articlewit.articlewit',
    name: 'articlewithtag',
    description: '',
    collectionName: '',
  },
};
