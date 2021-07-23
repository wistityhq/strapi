'use strict';

const _ = require('lodash');
const sanitizeEntity = require('../sanitize-entity');

describe('Sanitize Entity', () => {
  const input = {
    id: 1,
    email: 'foo@bar.com',
    firstname: 'foo',
    lastname: 'bar',
    password: 'qwerty',
  };

  const article = {
    name: 'foobar',
    content: 'lorem ipsum',
    secret: 'very-secret',
  };

  const inputWithRelation = {
    ...input,
    article,
  };

  const inputWithDz = {
    ...input,
    dz: [
      {
        __component: 'article',
        name: 'foo',
        content: 'bar',
        secret: 'secret-foobar',
      },
    ],
  };

  const userModel = {
    options: {},
    privateAttributes: ['email'],
    attributes: {
      email: {
        type: 'text',
        private: true,
      },
      firstname: {
        type: 'text',
      },
      lastname: {
        type: 'text',
      },
      password: {
        type: 'password',
      },
    },
  };

  const userRelModel = {
    ...userModel,
    attributes: {
      ...userModel.attributes,
      article: {
        collection: 'article',
      },
    },
  };

  const userDzModel = {
    ...userModel,
    attributes: {
      ...userModel.attributes,
      dz: {
        type: 'dynamiczone',
        components: ['article'],
      },
    },
  };

  const articleModel = {
    options: {},
    privateAttributes: ['secret'],
    attributes: {
      name: {
        type: 'text',
      },
      content: {
        type: 'text',
      },
      secret: {
        type: 'text',
        private: true,
      },
    },
  };

  const models = {
    user: userModel,
    article: articleModel,
    userRel: userRelModel,
    userDz: userDzModel,
  };

  beforeEach(() => {
    global.strapi = {
      getModel(name) {
        return models[name];
      },
      config: {
        get: jest.fn,
      },
    };
  });

  describe('Basic', () => {
    const tests = [
      [
        { withPrivate: false, isOutput: true, includeFields: null },
        _.pick(input, ['id', 'firstname', 'lastname']),
      ],
      [{ withPrivate: false, isOutput: false, includeFields: null }, input],
      [
        { withPrivate: false, isOutput: true, includeFields: ['firstname'] },
        _.pick(input, ['id', 'firstname']),
      ],
      [
        { withPrivate: false, isOutput: true, includeFields: ['email', 'firstname'] },
        _.pick(input, ['id', 'firstname']),
      ],
      [{ withPrivate: false, isOutput: true, includeFields: ['password'] }, _.pick(input, ['id'])],
      [
        { withPrivate: true, isOutput: true, includeFields: null },
        _.pick(input, ['id', 'email', 'firstname', 'lastname']),
      ],
      [{ withPrivate: true, isOutput: false, includeFields: null }, input],
      [
        { withPrivate: true, isOutput: true, includeFields: ['firstname'] },
        _.pick(input, ['id', 'firstname']),
      ],
      [
        { withPrivate: true, isOutput: true, includeFields: ['email', 'firstname'] },
        _.pick(input, ['id', 'email', 'firstname']),
      ],
      [{ withPrivate: true, isOutput: true, includeFields: ['password'] }, _.pick(input, ['id'])],
      [
        { withPrivate: true, isOutput: false, includeFields: ['firstname'] },
        _.pick(input, ['id', 'firstname']),
      ],
      [
        { withPrivate: true, isOutput: false, includeFields: ['email', 'firstname'] },
        _.pick(input, ['id', 'email', 'firstname']),
      ],
      [
        { withPrivate: true, isOutput: false, includeFields: ['password'] },
        _.pick(input, ['id', 'password']),
      ],
    ];

    test.each(tests)(`Test n°%#`, (options, expected) => {
      const { user: model } = models;
      expect(sanitizeEntity(input, { ...options, model })).toStrictEqual(expected);
    });
  });

  describe('With private attributes', () => {
    describe('When options.privateAttributes exists in model, the attributes in options.privateAttributes must be hidden', () => {
      const tests = [
        [{ withPrivate: false, isOutput: true, includeFields: null }, _.pick(input, ['lastname'])],
        [{ withPrivate: false, isOutput: false, includeFields: null }, input],
        [{ withPrivate: false, isOutput: true, includeFields: ['firstname'] }, {}],
        [{ withPrivate: false, isOutput: true, includeFields: ['email', 'firstname'] }, {}],
        [{ withPrivate: false, isOutput: true, includeFields: ['password'] }, {}],
        [
          { withPrivate: true, isOutput: true, includeFields: null },
          _.pick(input, ['id', 'email', 'firstname', 'lastname']),
        ],
        [{ withPrivate: true, isOutput: false, includeFields: null }, input],
        [
          { withPrivate: true, isOutput: true, includeFields: ['firstname'] },
          _.pick(input, ['id', 'firstname']),
        ],
        [
          { withPrivate: true, isOutput: true, includeFields: ['email', 'firstname'] },
          _.pick(input, ['id', 'email', 'firstname']),
        ],
        [{ withPrivate: true, isOutput: true, includeFields: ['password'] }, _.pick(input, ['id'])],
        [
          { withPrivate: true, isOutput: false, includeFields: ['firstname'] },
          _.pick(input, ['id', 'firstname']),
        ],
        [
          { withPrivate: true, isOutput: false, includeFields: ['email', 'firstname'] },
          _.pick(input, ['id', 'email', 'firstname']),
        ],
        [
          { withPrivate: true, isOutput: false, includeFields: ['password'] },
          _.pick(input, ['id', 'password']),
        ],
      ];

      const model = {
        ...models.user,
        options: {
          ...models.user.options,
          privateAttributes: ['firstname'],
        },
        privateAttributes: [].concat(models.user.privateAttributes, ['firstname'], ['id']),
      };

      test.each(tests)(`Test n°%#`, (options, expected) => {
        expect(sanitizeEntity(input, { ...options, model })).toStrictEqual(expected);
      });
    });
  });

  describe('With relation', () => {
    const tests = [
      [
        inputWithRelation,
        { withPrivate: false, isOutput: true, includeFields: null },
        _.pick(inputWithRelation, [
          'id',
          'firstname',
          'lastname',
          'article.name',
          'article.content',
        ]),
      ],
      [
        inputWithRelation,
        { withPrivate: false, isOutput: true, includeFields: ['firstname', 'lastname'] },
        _.pick(inputWithRelation, ['id', 'firstname', 'lastname']),
      ],
      [
        inputWithRelation,
        { withPrivate: false, isOutput: true, includeFields: ['article'] },
        _.pick(inputWithRelation, ['id', 'article.name', 'article.content']),
      ],
      [
        inputWithRelation,
        { withPrivate: false, isOutput: true, includeFields: ['article.name'] },
        _.pick(inputWithRelation, ['id', 'article.name']),
      ],
      [
        inputWithRelation,
        { withPrivate: true, isOutput: true, includeFields: null },
        _.pick(inputWithRelation, ['id', 'email', 'firstname', 'lastname', 'article']),
      ],
      [
        { ...inputWithRelation, article: _.times(3, () => _.clone(article)) },
        { withPrivate: false, isOutput: true, includeFields: null },
        {
          ..._.pick(inputWithRelation, ['id', 'firstname', 'lastname']),
          article: _.times(3, () => _.pick(article, ['name', 'content'])),
        },
      ],
    ];

    test.each(tests)(`Test n°%#`, (source, options, expected) => {
      const { userRel: model } = models;
      expect(sanitizeEntity(source, { ...options, model })).toStrictEqual(expected);
    });
  });

  describe('With Dynamic Zone', () => {
    test('Dynamic zone null', () => {
      const { userDz: model } = models;
      const dataSource = { ...inputWithDz, dz: null };

      const expected = _.pick(dataSource, ['id', 'firstname', 'lastname', 'dz']);

      expect(sanitizeEntity(dataSource, { model })).toStrictEqual(expected);
    });

    test('Dynamic zone with a basic component', () => {
      const { userDz: model } = models;

      const expected = {
        ..._.pick(inputWithDz, ['id', 'firstname', 'lastname']),
        dz: inputWithDz.dz.map(comp => _.pick(comp, ['__component', 'name', 'content'])),
      };

      expect(sanitizeEntity(inputWithDz, { model })).toStrictEqual(expected);
    });
  });

  describe('Edge cases', () => {
    test('It returns the input data if the model is nil and isOutput false', () => {
      expect(sanitizeEntity(input, { model: null, isOutput: false })).toEqual(input);
      expect(sanitizeEntity(input, { model: undefined, isOutput: false })).toEqual(input);
    });

    test('It returns null if the model is nil and isOutput true', () => {
      expect(sanitizeEntity(input, { model: null })).toBeNull();
      expect(sanitizeEntity(input, { model: undefined })).toBeNull();
    });

    test(`It returns the input data as-is if it's not an object or an array`, () => {
      const { user: model } = models;
      expect(sanitizeEntity('foobar', { model })).toBe('foobar');
      expect(sanitizeEntity(undefined, { model })).toBeUndefined();
      expect(sanitizeEntity(null, { model })).toBeNull();
    });

    test('It sanitizes all entries if the input is an array', () => {
      const dataSource = [_.clone(input), _.clone(input)];

      const expected = [
        _.pick(input, 'id', 'firstname', 'lastname'),
        _.pick(input, 'id', 'firstname', 'lastname'),
      ];

      const { user: model } = models;

      expect(sanitizeEntity(dataSource, { model })).toStrictEqual(expected);
    });

    test(`It should put the relation value as-is if it's nil'`, () => {
      const dataSource = { ...inputWithRelation, article: null };
      const expected = _.omit(dataSource, ['email', 'password']);

      const { userRel: model } = models;

      expect(sanitizeEntity(dataSource, { model })).toStrictEqual(expected);
    });

    test(`It should make sure that legacy data parsing returns an object`, () => {
      const dataSource = {
        toJSON: jest.fn(() => input),
      };

      const invalidDataSource = {
        toJSON: jest.fn(() => null),
      };

      const { user: model } = models;

      expect(sanitizeEntity(dataSource, { model })).toStrictEqual(
        _.omit(input, ['email', 'password'])
      );
      expect(dataSource.toJSON).toHaveBeenCalled();

      expect(sanitizeEntity(invalidDataSource, { model })).toBeNull();
      expect(invalidDataSource.toJSON).toHaveBeenCalled();
    });

    test('It should handle custom fields', () => {
      const dataSource = { ...input, foo: 'bar' };
      const expected = _.omit(dataSource, ['email', 'password']);
      const { user: model } = models;

      expect(sanitizeEntity(dataSource, { model })).toStrictEqual(expected);
    });
  });
});
