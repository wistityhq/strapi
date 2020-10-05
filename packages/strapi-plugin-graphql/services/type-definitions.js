'use strict';

/**
 * GraphQL.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

const _ = require('lodash');
const { contentTypes } = require('strapi-utils');

const DynamicZoneScalar = require('../types/dynamiczoneScalar');

const { formatModelConnectionsGQL } = require('./build-aggregation');
const types = require('./type-builder');
const { mergeSchemas, convertToParams, convertToQuery, amountLimiting } = require('./utils');
const { toSDL, getTypeDescription } = require('./schema-definitions');
const { toSingular, toPlural } = require('./naming');
const { buildQuery, buildMutation } = require('./resolvers-builder');
const { actionExists } = require('./utils');

const isQueryEnabled = (schema, name) => {
  return _.get(schema, `resolver.Query.${name}`) !== false;
};

const isMutationEnabled = (schema, name) => {
  return _.get(schema, `resolver.Mutation.${name}`) !== false;
};

const isNotPrivate = _.curry((model, attributeName) => {
  return !contentTypes.isPrivateAttribute(model, attributeName);
});

const buildTypeDefObj = model => {
  const { associations = [], attributes, primaryKey, globalId } = model;

  const typeDef = {
    id: 'ID!',
    [primaryKey]: 'ID!',
  };

  // Add timestamps attributes.
  if (_.isArray(_.get(model, 'options.timestamps'))) {
    const [createdAtKey, updatedAtKey] = model.options.timestamps;
    typeDef[createdAtKey] = 'DateTime!';
    typeDef[updatedAtKey] = 'DateTime!';
  }

  Object.keys(attributes)
    .filter(isNotPrivate(model))
    .forEach(attributeName => {
      const attribute = attributes[attributeName];
      // Convert our type to the GraphQL type.
      typeDef[attributeName] = types.convertType({
        attribute,
        modelName: globalId,
        attributeName,
      });
    });

  // Change field definition for collection relations
  associations
    .filter(association => association.type === 'collection')
    .filter(association => isNotPrivate(model, association.alias))
    .forEach(association => {
      typeDef[`${association.alias}(sort: String, limit: Int, start: Int, where: JSON)`] =
        typeDef[association.alias];

      delete typeDef[association.alias];
    });

  return typeDef;
};

const generateEnumDefinitions = (attributes, globalId) => {
  return Object.keys(attributes)
    .filter(attribute => attributes[attribute].type === 'enumeration')
    .map(attribute => {
      const definition = attributes[attribute];

      const name = types.convertEnumType(definition, globalId, attribute);
      const values = definition.enum.map(v => `\t${v}`).join('\n');
      return `enum ${name} {\n${values}\n}\n`;
    })
    .join('');
};

const generateDynamicZoneDefinitions = (attributes, globalId, schema) => {
  Object.keys(attributes)
    .filter(attribute => attributes[attribute].type === 'dynamiczone')
    .forEach(attribute => {
      const { components } = attributes[attribute];

      const typeName = `${globalId}${_.upperFirst(_.camelCase(attribute))}DynamicZone`;

      if (components.length === 0) {
        // Create dummy type because graphql doesn't support empty ones

        schema.definition += `type ${typeName} { _:Boolean}`;
        schema.definition += `\nscalar EmptyQuery\n`;
      } else {
        const componentsTypeNames = components.map(componentUID => {
          const compo = strapi.components[componentUID];
          if (!compo) {
            throw new Error(
              `Trying to creating dynamiczone type with unkown component ${componentUID}`
            );
          }

          return compo.globalId;
        });

        const unionType = `union ${typeName} = ${componentsTypeNames.join(' | ')}`;

        schema.definition += `\n${unionType}\n`;
      }

      const inputTypeName = `${typeName}Input`;
      schema.definition += `\nscalar ${inputTypeName}\n`;

      schema.resolvers[typeName] = {
        __resolveType(obj) {
          return strapi.components[obj.__component].globalId;
        },
      };

      schema.resolvers[inputTypeName] = new DynamicZoneScalar({
        name: inputTypeName,
        attribute,
        globalId,
        components,
      });
    });
};

const buildAssocResolvers = model => {
  const contentManager = strapi.plugins['content-manager'].services['contentmanager'];

  const { primaryKey, associations = [] } = model;

  return associations
    .filter(association => isNotPrivate(model, association.alias))
    .reduce((resolver, association) => {
      const target = association.model || association.collection;
      const targetModel = strapi.getModel(target, association.plugin);

      switch (association.nature) {
        case 'oneToManyMorph':
        case 'manyMorphToOne':
        case 'manyMorphToMany':
        case 'manyToManyMorph':
        case 'manyWay': {
          resolver[association.alias] = async obj => {
            if (obj[association.alias]) {
              return obj[association.alias];
            }

            const entry = await contentManager.fetch(model.uid, obj[primaryKey], {
              populate: [association.alias],
            });

            return entry[association.alias];
          };
          break;
        }
        default: {
          resolver[association.alias] = async (obj, options) => {
            // Construct parameters object to retrieve the correct related entries.
            const params = {
              model: targetModel.uid,
            };

            let queryOpts = {};

            if (association.type === 'model') {
              params[targetModel.primaryKey] = _.get(
                obj,
                `${association.alias}.${targetModel.primaryKey}`,
                obj[association.alias]
              );
            } else {
              const queryParams = amountLimiting(options);
              queryOpts = {
                ...queryOpts,
                ...convertToParams(_.omit(queryParams, 'where')), // Convert filters (sort, limit and start/skip)
                ...convertToQuery(queryParams.where),
              };

              if (
                ((association.nature === 'manyToMany' && association.dominant) ||
                  association.nature === 'manyWay') &&
                _.has(obj, association.alias) // if populated
              ) {
                _.set(
                  queryOpts,
                  ['query', targetModel.primaryKey],
                  obj[association.alias]
                    ? obj[association.alias].map(val => val[targetModel.primaryKey] || val).sort()
                    : []
                );
              } else {
                _.set(queryOpts, ['query', association.via], obj[targetModel.primaryKey]);
              }
            }

            return association.model
              ? strapi.plugins.graphql.services['data-loaders'].loaders[targetModel.uid].load({
                  params,
                  options: queryOpts,
                  single: true,
                })
              : strapi.plugins.graphql.services['data-loaders'].loaders[targetModel.uid].load({
                  options: queryOpts,
                  association,
                });
          };
          break;
        }
      }

      return resolver;
    }, {});
};

/**
 * Construct the GraphQL query & definition and apply the right resolvers.
 *
 * @return Object
 */
const buildModels = models => {
  return models.map(model => {
    const { kind, modelType } = model;

    if (modelType === 'component') {
      return buildComponent(model);
    }

    switch (kind) {
      case 'singleType':
        return buildSingleType(model);
      default:
        return buildCollectionType(model);
    }
  });
};

const buildModelDefinition = (model, globalType = {}) => {
  const { globalId, primaryKey } = model;

  const schema = {
    definition: '',
    query: {},
    mutation: {},
    resolvers: {
      Query: {},
      Mutation: {},
      [globalId]: {
        id: parent => parent[primaryKey] || parent.id,
        ...buildAssocResolvers(model),
      },
    },
  };

  const typeDefObj = buildTypeDefObj(model);

  schema.definition += generateEnumDefinitions(model.attributes, globalId);
  generateDynamicZoneDefinitions(model.attributes, globalId, schema);

  const description = getTypeDescription(globalType, model);
  const fields = toSDL(typeDefObj, globalType, model);
  const typeDef = `${description}type ${globalId} {${fields}}\n`;

  schema.definition += typeDef;
  return schema;
};

const buildComponent = component => {
  const { globalId } = component;
  const schema = buildModelDefinition(component);

  schema.definition += types.generateInputModel(component, globalId, {
    allowIds: true,
  });

  return schema;
};

const buildSingleType = model => {
  const { uid, modelName } = model;

  const singularName = toSingular(modelName);

  const _schema = _.cloneDeep(_.get(strapi.plugins, 'graphql.config._schema.graphql', {}));

  const globalType = _.get(_schema, `type.${model.globalId}`, {});

  const localSchema = buildModelDefinition(model, globalType);

  // Add definition to the schema but this type won't be "queriable" or "mutable".
  if (globalType === false) {
    return localSchema;
  }

  if (isQueryEnabled(_schema, singularName)) {
    _.merge(localSchema, {
      query: {
        // TODO: support all the unique fields
        [singularName]: model.globalId,
      },
      resolvers: {
        Query: {
          [singularName]: buildQuery(singularName, {
            resolver: `${uid}.find`,
            ..._.get(_schema, `resolver.Query.${singularName}`, {}),
          }),
        },
      },
    });
  }

  // Add model Input definition.
  localSchema.definition += types.generateInputModel(model, modelName);

  // build every mutation
  ['update', 'delete'].forEach(action => {
    const mutationSchema = buildMutationTypeDef({ model, action }, { _schema });

    mergeSchemas(localSchema, mutationSchema);
  });

  return localSchema;
};

const buildCollectionType = model => {
  const { globalId, plugin, modelName, uid } = model;

  const singularName = toSingular(modelName);
  const pluralName = toPlural(modelName);

  const _schema = _.cloneDeep(_.get(strapi.plugins, 'graphql.config._schema.graphql', {}));

  const globalType = _.get(_schema, `type.${model.globalId}`, {});

  const localSchema = {
    definition: '',
    query: {},
    mutation: {},
    resolvers: {
      Query: {},
      Mutation: {},
      // define default resolver for this model
      [globalId]: {
        id: parent => parent[model.primaryKey] || parent.id,
        ...buildAssocResolvers(model),
      },
    },
  };

  const typeDefObj = buildTypeDefObj(model);

  localSchema.definition += generateEnumDefinitions(model.attributes, globalId);
  generateDynamicZoneDefinitions(model.attributes, globalId, localSchema);

  const description = getTypeDescription(globalType, model);
  const fields = toSDL(typeDefObj, globalType, model);
  const typeDef = `${description}type ${globalId} {${fields}}\n`;

  localSchema.definition += typeDef;

  // Add definition to the schema but this type won't be "queriable" or "mutable".
  if (globalType === false) {
    return localSchema;
  }

  if (isQueryEnabled(_schema, singularName)) {
    const resolverOpts = {
      resolver: `${uid}.findOne`,
      ..._.get(_schema, `resolver.Query.${singularName}`, {}),
    };
    if (actionExists(resolverOpts)) {
      _.merge(localSchema, {
        query: {
          [`${singularName}(id: ID!)`]: `${model.globalId}!`,
        },
        resolvers: {
          Query: {
            [singularName]: buildQuery(singularName, resolverOpts),
          },
        },
      });
    }
  }

  if (isQueryEnabled(_schema, pluralName)) {
    const resolverOpts = {
      resolver: `${uid}.find`,
      ..._.get(_schema, `resolver.Query.${pluralName}`, {}),
    };
    if (actionExists(resolverOpts)) {
      _.merge(localSchema, {
        query: {
          [`${pluralName}(sort: String, limit: Int, start: Int, where: JSON)`]: `[${model.globalId}!]!`,
        },
        resolvers: {
          Query: {
            [pluralName]: buildQuery(pluralName, resolverOpts),
          },
        },
      });

      // Generate the aggregation for the given model
      const aggregationSchema = formatModelConnectionsGQL({
        fields: typeDefObj,
        model,
        name: modelName,
        resolver: resolverOpts,
        plugin,
      });

      mergeSchemas(localSchema, aggregationSchema);
    }
  }

  // Add model Input definition.
  localSchema.definition += types.generateInputModel(model, modelName);

  // build every mutation
  ['create', 'update', 'delete'].forEach(action => {
    const mutationSchema = buildMutationTypeDef({ model, action }, { _schema });
    mergeSchemas(localSchema, mutationSchema);
  });

  return localSchema;
};

// TODO:
// - Implement batch methods (need to update the content-manager as well).
// - Implement nested transactional methods (create/update).
const buildMutationTypeDef = ({ model, action }, { _schema }) => {
  const capitalizedName = _.upperFirst(toSingular(model.modelName));
  const mutationName = `${action}${capitalizedName}`;

  const resolverOpts = {
    resolver: `${model.uid}.${action}`,
    transformOutput: result => ({ [toSingular(model.modelName)]: result }),
    ..._.get(_schema, `resolver.Mutation.${mutationName}`, {}),
  };

  if (!actionExists(resolverOpts)) {
    return {};
  }

  const definition = types.generateInputPayloadArguments({
    model,
    name: model.modelName,
    mutationName,
    action,
  });

  // ignore if disabled
  if (!isMutationEnabled(_schema, mutationName)) {
    return {
      definition,
    };
  }

  const { kind } = model;

  let mutationDef = `${mutationName}(input: ${mutationName}Input)`;
  if (kind === 'singleType' && action === 'delete') {
    mutationDef = mutationName;
  }

  return {
    definition,
    mutation: {
      [mutationDef]: `${mutationName}Payload`,
    },
    resolvers: {
      Mutation: {
        [mutationName]: buildMutation(mutationName, resolverOpts),
      },
    },
  };
};

module.exports = {
  buildModels,
};
