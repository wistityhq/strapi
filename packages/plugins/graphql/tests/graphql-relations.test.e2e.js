'use strict';

// Helpers.
const _ = require('lodash');
const { createTestBuilder } = require('../../../../test/helpers/builder');
const { createStrapiInstance } = require('../../../../test/helpers/strapi');
const { createAuthRequest } = require('../../../../test/helpers/request');

const builder = createTestBuilder();
let strapi;
let rq;
let graphqlQuery;

// utils
const selectFields = doc => _.pick(doc, ['id', 'name', 'color']);

const rgbColorComponent = {
  attributes: {
    name: {
      type: 'text',
    },
    red: {
      type: 'integer',
    },
    green: {
      type: 'integer',
    },
    blue: {
      type: 'integer',
    },
  },
  name: 'rgbColor',
};

const documentModel = {
  attributes: {
    name: {
      type: 'richtext',
    },
    content: {
      type: 'richtext',
    },
  },
  name: 'document',
  description: '',
  collectionName: '',
};

const labelModel = {
  attributes: {
    name: {
      type: 'richtext',
    },
    documents: {
      type: 'relation',
      relation: 'manyToMany',
      target: 'application::document.document',
      targetAttribute: 'labels',
    },
    color: {
      type: 'component',
      component: 'default.rgb-color',
      repeatable: false,
    },
  },
  name: 'label',
  description: '',
  collectionName: '',
};

const carModel = {
  attributes: {
    name: {
      type: 'text',
    },
  },
  name: 'car',
  description: '',
  collectionName: '',
};

const personModel = {
  attributes: {
    name: {
      type: 'text',
    },
    privateName: {
      type: 'text',
      private: true,
    },
    privateCars: {
      type: 'relation',
      relation: 'oneToMany',
      target: 'application::car.car',
      targetAttribute: 'person',
      private: true,
    },
  },
  name: 'person',
  description: '',
  collectionName: '',
};

describe('Test Graphql Relations API End to End', () => {
  beforeAll(async () => {
    await builder
      .addComponent(rgbColorComponent)
      .addContentTypes([documentModel, labelModel, carModel, personModel])
      .build();

    strapi = await createStrapiInstance();
    rq = await createAuthRequest({ strapi });

    graphqlQuery = body => {
      return rq({
        url: '/graphql',
        method: 'POST',
        body,
      });
    };
  });

  afterAll(async () => {
    await strapi.destroy();
    await builder.cleanup();
  });

  describe('Test relations features', () => {
    let data = {
      labels: [],
      documents: [],
      people: [],
      cars: [],
    };
    const labelsPayload = [
      { name: 'label 1', color: null },
      { name: 'label 2', color: null },
      { name: 'labelWithColor', color: { name: 'tomato', red: 255, green: 99, blue: 71 } },
    ];
    const documentsPayload = [{ name: 'document 1' }, { name: 'document 2' }];

    test.each(labelsPayload)('Create label %o', async label => {
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          mutation createLabel($input: createLabelInput) {
            createLabel(input: $input) {
              label {
                name
                color {
                  name
                  red
                  green
                  blue
                }
              }
            }
          }
        `,
        variables: {
          input: {
            data: label,
          },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        data: {
          createLabel: {
            label,
          },
        },
      });
    });

    test('List labels', async () => {
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          {
            labels {
              id
              name
              color {
                name
                red
                green
                blue
              }
            }
          }
        `,
      });

      const { body } = res;

      expect(res.statusCode).toBe(200);
      expect(body).toMatchObject({
        data: {
          labels: labelsPayload,
        },
      });

      // assign for later use
      data.labels = data.labels.concat(res.body.data.labels);
    });

    test.each(documentsPayload)('Create document linked to every labels %o', async document => {
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          mutation createDocument($input: createDocumentInput) {
            createDocument(input: $input) {
              document {
                name
                labels {
                  id
                  name
                  color {
                    name
                    red
                    green
                    blue
                  }
                }
              }
            }
          }
        `,
        variables: {
          input: {
            data: {
              ...document,
              labels: data.labels.map(t => t.id),
            },
          },
        },
      });

      const { body } = res;

      expect(res.statusCode).toBe(200);

      expect(body).toMatchObject({
        data: {
          createDocument: {
            document: {
              ...selectFields(document),
              labels: expect.arrayContaining(data.labels.map(selectFields)),
            },
          },
        },
      });
    });

    test('List documents with labels', async () => {
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          {
            documents {
              id
              name
              labels {
                id
                name
                color {
                  name
                  red
                  green
                  blue
                }
              }
            }
          }
        `,
      });

      const { body } = res;

      expect(res.statusCode).toBe(200);
      expect(body).toMatchObject({
        data: {
          documents: expect.arrayContaining(
            data.documents.map(document => ({
              ...selectFields(document),
              labels: expect.arrayContaining(data.labels.map(selectFields)),
            }))
          ),
        },
      });

      // assign for later use
      data.documents = res.body.data.documents;
    });

    test('List Labels with documents', async () => {
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          {
            labels {
              id
              name
              color {
                name
                red
                green
                blue
              }
              documents {
                id
                name
              }
            }
          }
        `,
      });

      const { body } = res;

      expect(res.statusCode).toBe(200);
      expect(body).toMatchObject({
        data: {
          labels: expect.arrayContaining(
            data.labels.map(label => ({
              ...selectFields(label),
              documents: expect.arrayContaining(data.documents.map(selectFields)),
            }))
          ),
        },
      });

      // assign for later use
      data.labels = res.body.data.labels;
    });

    test('Deep query', async () => {
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          {
            documents(where: { labels: { name_contains: "label 1" } }) {
              id
              name
              labels {
                id
                name
                color {
                  name
                  red
                  green
                  blue
                }
              }
            }
          }
        `,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        data: {
          documents: expect.arrayContaining(data.documents),
        },
      });
    });

    test('Update Document relations removes correctly a relation', async () => {
      // if I remove a label from an document is it working
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          mutation updateDocument($input: updateDocumentInput) {
            updateDocument(input: $input) {
              document {
                id
                name
                labels {
                  id
                  name
                  color {
                    name
                    red
                    green
                    blue
                  }
                }
              }
            }
          }
        `,
        variables: {
          input: {
            where: {
              id: data.documents[0].id,
            },
            data: {
              labels: [data.labels[0].id],
            },
          },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        data: {
          updateDocument: {
            document: {
              ...selectFields(data.documents[0]),
              labels: [selectFields(data.labels[0])],
            },
          },
        },
      });
    });

    test('Delete Labels and test Documents relations', async () => {
      for (let label of data.labels) {
        const res = await graphqlQuery({
          query: /* GraphQL */ `
            mutation deleteLabel($input: deleteLabelInput) {
              deleteLabel(input: $input) {
                label {
                  id
                  name
                  color {
                    name
                    red
                    green
                    blue
                  }
                }
              }
            }
          `,
          variables: {
            input: {
              where: {
                id: label.id,
              },
            },
          },
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({
          data: {
            deleteLabel: {
              label: {
                id: label.id,
              },
            },
          },
        });
      }

      const res = await graphqlQuery({
        query: /* GraphQL */ `
          {
            documents {
              id
              name
              labels {
                id
                name
                color {
                  name
                  red
                  green
                  blue
                }
              }
            }
          }
        `,
      });

      const { body } = res;

      expect(res.statusCode).toBe(200);
      expect(body).toMatchObject({
        data: {
          documents: expect.arrayContaining(
            data.documents.map(document => ({
              ...selectFields(document),
              labels: [],
            }))
          ),
        },
      });
    });

    test('Delete Documents', async () => {
      for (let document of data.documents) {
        const res = await graphqlQuery({
          query: /* GraphQL */ `
            mutation deleteDocument($input: deleteDocumentInput) {
              deleteDocument(input: $input) {
                document {
                  id
                  name
                }
              }
            }
          `,
          variables: {
            input: {
              where: {
                id: document.id,
              },
            },
          },
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({
          data: {
            deleteDocument: {
              document: {
                id: document.id,
              },
            },
          },
        });
      }
    });

    test('Create person', async () => {
      const person = {
        name: 'Chuck Norris',
        privateName: 'Jean-Eude',
      };
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          mutation createPerson($input: createPersonInput) {
            createPerson(input: $input) {
              person {
                id
                name
              }
            }
          }
        `,
        variables: {
          input: {
            data: person,
          },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        data: {
          createPerson: {
            person: {
              id: expect.anything(),
              name: person.name,
            },
          },
        },
      });
      data.people.push(res.body.data.createPerson.person);
    });

    test("Can't list a private field", async () => {
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          {
            people {
              name
              privateName
            }
          }
        `,
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        errors: [
          {
            message: 'Cannot query field "privateName" on type "Person".',
          },
        ],
      });
    });

    test('Create a car linked to a person (oneToMany)', async () => {
      const car = {
        name: 'Peugeot 508',
        person: data.people[0].id,
      };
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          mutation createCar($input: createCarInput) {
            createCar(input: $input) {
              car {
                id
                name
                person {
                  id
                  name
                }
              }
            }
          }
        `,
        variables: {
          input: {
            data: {
              ...car,
            },
          },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        data: {
          createCar: {
            car: {
              id: expect.anything(),
              name: car.name,
              person: data.people[0],
            },
          },
        },
      });

      data.cars.push({ id: res.body.data.createCar.car.id });
    });

    test("Can't list a private oneToMany relation", async () => {
      const res = await graphqlQuery({
        query: /* GraphQL */ `
          {
            people {
              name
              privateCars
            }
          }
        `,
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        errors: [
          {
            message: 'Cannot query field "privateCars" on type "Person".',
          },
        ],
      });
    });

    test('Edit person/cars relations removes correctly a car', async () => {
      const newPerson = {
        name: 'Check Norris Junior',
        privateCars: [],
      };

      const mutationRes = await graphqlQuery({
        query: /* GraphQL */ `
          mutation updatePerson($input: updatePersonInput) {
            updatePerson(input: $input) {
              person {
                id
              }
            }
          }
        `,
        variables: {
          input: {
            where: {
              id: data.people[0].id,
            },
            data: {
              ...newPerson,
            },
          },
        },
      });
      expect(mutationRes.statusCode).toBe(200);

      const queryRes = await graphqlQuery({
        query: /* GraphQL */ `
          query($id: ID!) {
            car(id: $id) {
              person {
                id
              }
            }
          }
        `,
        variables: {
          id: data.cars[0].id,
        },
      });
      expect(queryRes.statusCode).toBe(200);
      expect(queryRes.body).toEqual({
        data: {
          car: {
            person: null,
          },
        },
      });
    });
  });
});
