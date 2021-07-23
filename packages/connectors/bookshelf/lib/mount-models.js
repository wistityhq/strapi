'use strict';
const _ = require('lodash');
const { singular } = require('pluralize');

const { contentTypes: contentTypesUtils } = require('@strapi/utils');
const utilsModels = require('./models');
const relations = require('./relations');
const buildDatabaseSchema = require('./build-database-schema');
const {
  createComponentJoinTables,
  createComponentModels,
} = require('./generate-component-relations');
const { createParser } = require('./parser');
const { createFormatter } = require('./formatter');
const populateFetch = require('./populate');

const {
  PUBLISHED_AT_ATTRIBUTE,
  CREATED_BY_ATTRIBUTE,
  UPDATED_BY_ATTRIBUTE,
} = contentTypesUtils.constants;

const PIVOT_PREFIX = '_pivot_';

const getDatabaseName = connection => {
  const dbName = _.get(connection.settings, 'database');
  const dbSchema = _.get(connection.settings, 'schema', 'public');
  switch (_.get(connection.settings, 'client')) {
    case 'sqlite3':
      return 'main';
    case 'pg':
      return `${dbName}.${dbSchema}`;
    case 'mysql':
      return dbName;
    default:
      return dbName;
  }
};

const isARelatedField = (morphAttrInfo, attr) => {
  const samePlugin =
    morphAttrInfo.plugin === attr.plugin || (_.isNil(morphAttrInfo.plugin) && _.isNil(attr.plugin));
  const sameModel = [attr.model, attr.collection].includes(morphAttrInfo.model);
  const isMorph = attr.via === morphAttrInfo.name;

  return isMorph && sameModel && samePlugin;
};

const getRelatedFieldsOfMorphModel = morphAttrInfo => morphModel => {
  const relatedFields = _.reduce(
    morphModel.attributes,
    (fields, attr, attrName) => {
      return isARelatedField(morphAttrInfo, attr) ? fields.concat(attrName) : fields;
    },
    []
  );

  return { collectionName: morphModel.collectionName, relatedFields };
};

module.exports = async ({ models, target }, ctx, { selfFinalize = false } = {}) => {
  const { GLOBALS, connection, ORM } = ctx;

  // Parse every authenticated model.
  const updateModel = async model => {
    const definition = models[model];

    if (!definition.uid.startsWith('strapi::') && definition.modelType !== 'component') {
      if (contentTypesUtils.hasDraftAndPublish(definition)) {
        definition.attributes[PUBLISHED_AT_ATTRIBUTE] = {
          type: 'datetime',
          configurable: false,
          writable: true,
          visible: false,
        };
      }

      const isPrivate = !_.get(definition, 'options.populateCreatorFields', false);

      definition.attributes[CREATED_BY_ATTRIBUTE] = {
        model: 'user',
        plugin: 'admin',
        configurable: false,
        writable: false,
        visible: false,
        private: isPrivate,
      };

      definition.attributes[UPDATED_BY_ATTRIBUTE] = {
        model: 'user',
        plugin: 'admin',
        configurable: false,
        writable: false,
        visible: false,
        private: isPrivate,
      };
    }

    definition.globalName = _.upperFirst(_.camelCase(definition.globalId));
    definition.associations = [];

    // Define local GLOBALS to expose every models in this file.
    GLOBALS[definition.globalId] = {};

    // Add some information about ORM & client connection & tableName
    definition.orm = 'bookshelf';
    definition.databaseName = getDatabaseName(connection);
    definition.client = _.get(connection.settings, 'client');
    definition.primaryKey = 'id';
    definition.primaryKeyType = 'integer';

    target[model].allAttributes = { ...definition.attributes };

    const createdAtCol = _.get(definition, 'options.timestamps.0', 'created_at');
    const updatedAtCol = _.get(definition, 'options.timestamps.1', 'updated_at');
    if (_.get(definition, 'options.timestamps', false)) {
      _.set(definition, 'options.timestamps', [createdAtCol, updatedAtCol]);
      target[model].allAttributes[createdAtCol] = { type: 'timestamp' };
      target[model].allAttributes[updatedAtCol] = { type: 'timestamp' };
    } else {
      _.set(definition, 'options.timestamps', false);
    }

    // Register the final model for Bookshelf.
    const loadedModel = _.assign(
      {
        requireFetch: false,
        tableName: definition.collectionName,
        hasTimestamps: definition.options.timestamps,
        associations: [],
        defaults: Object.keys(definition.attributes).reduce((acc, current) => {
          if (definition.attributes[current].type && definition.attributes[current].default) {
            acc[current] = definition.attributes[current].default;
          }

          return acc;
        }, {}),
      },
      definition.options
    );

    const componentAttributes = Object.keys(definition.attributes).filter(key =>
      ['component', 'dynamiczone'].includes(definition.attributes[key].type)
    );

    if (_.isString(_.get(connection, 'options.pivot_prefix'))) {
      loadedModel.toJSON = function(options = {}) {
        const { shallow = false, omitPivot = false } = options;
        const attributes = this.serialize(options);

        if (!shallow) {
          const pivot = this.pivot && !omitPivot && this.pivot.attributes;

          // Remove pivot attributes with prefix.
          _.keys(pivot).forEach(key => delete attributes[`${PIVOT_PREFIX}${key}`]);

          // Add pivot attributes without prefix.
          const pivotAttributes = _.mapKeys(
            pivot,
            (value, key) => `${connection.options.pivot_prefix}${key}`
          );

          return Object.assign({}, attributes, pivotAttributes);
        }

        return attributes;
      };
    }

    await createComponentModels({
      model: loadedModel,
      definition,
      ORM,
      GLOBALS,
    });

    // Add every relationships to the loaded model for Bookshelf.
    // Basic attributes don't need this-- only relations.
    Object.keys(definition.attributes).forEach(name => {
      const details = definition.attributes[name];
      if (details.type !== undefined) {
        return;
      }

      const { nature, verbose } =
        utilsModels.getNature({
          attribute: details,
          attributeName: name,
          modelName: model.toLowerCase(),
        }) || {};

      // Build associations key
      utilsModels.defineAssociations(model.toLowerCase(), definition, details, name);

      let globalId;
      const globalName = details.model || details.collection || '';

      // Exclude polymorphic association.
      if (globalName !== '*') {
        globalId = strapi.db.getModel(globalName.toLowerCase(), details.plugin).globalId;
      }

      switch (verbose) {
        case 'hasOne': {
          const target = details.plugin
            ? strapi.plugins[details.plugin].models[details.model]
            : strapi.models[details.model];

          const FK = _.findKey(target.attributes, details => {
            if (
              _.has(details, 'model') &&
              details.model === model &&
              _.has(details, 'via') &&
              details.via === name
            ) {
              return details;
            }
          });

          const columnName = _.get(target.attributes, [FK, 'columnName'], FK);

          loadedModel[name] = function() {
            return this.hasOne(GLOBALS[globalId], columnName);
          };
          break;
        }
        case 'hasMany': {
          const columnName = details.plugin
            ? _.get(
                strapi.plugins,
                [
                  details.plugin,
                  'models',
                  details.collection,
                  'attributes',
                  details.via,
                  'columnName',
                ],
                details.via
              )
            : _.get(
                strapi.models,
                [model.collection, 'attributes', details.via, 'columnName'],
                details.via
              );

          // Set this info to be able to see if this field is a real database's field.
          details.isVirtual = true;

          loadedModel[name] = function() {
            return this.hasMany(GLOBALS[globalId], columnName);
          };
          break;
        }
        case 'belongsTo': {
          loadedModel[name] = function() {
            return this.belongsTo(GLOBALS[globalId], _.get(details, 'columnName', name));
          };
          break;
        }
        case 'belongsToMany': {
          const targetModel = strapi.db.getModel(details.collection, details.plugin);

          // Force singular foreign key
          details.attribute = singular(details.collection);
          details.column = 'id';

          // Set this info to be able to see if this field is a real database's field.
          details.isVirtual = true;

          if (nature === 'manyWay') {
            const joinTableName =
              details.collectionName || `${definition.collectionName}__${_.snakeCase(name)}`;

            const foreignKey = `${singular(definition.collectionName)}_${definition.primaryKey}`;

            let otherKey = `${details.attribute}_${details.column}`;

            if (otherKey === foreignKey) {
              otherKey = `related_${otherKey}`;
              details.attribute = `related_${details.attribute}`;
            }

            loadedModel[name] = function() {
              const targetBookshelfModel = GLOBALS[globalId];
              let collection = this.belongsToMany(
                targetBookshelfModel,
                joinTableName,
                foreignKey,
                otherKey
              );

              if (Array.isArray(details.withPivot)) {
                return collection.withPivot(details.withPivot);
              }

              return collection;
            };
          } else {
            const joinTableName = utilsModels.getCollectionName(
              targetModel.attributes[details.via],
              details
            );

            const relationship = targetModel.attributes[details.via];

            // Define PK column
            relationship.attribute = singular(relationship.collection);
            relationship.column = definition.primaryKey;

            // Sometimes the many-to-many relationships
            // is on the same keys on the same models (ex: `friends` key in model `User`)
            if (
              `${details.attribute}_${details.column}` ===
              `${relationship.attribute}_${relationship.column}`
            ) {
              relationship.attribute = singular(details.via);
            }

            loadedModel[name] = function() {
              const targetBookshelfModel = GLOBALS[globalId];

              const foreignKey = `${relationship.attribute}_${relationship.column}`;
              const otherKey = `${details.attribute}_${details.column}`;

              let collection = this.belongsToMany(
                targetBookshelfModel,
                joinTableName,
                foreignKey,
                otherKey
              );

              if (Array.isArray(details.withPivot)) {
                return collection.withPivot(details.withPivot);
              }

              return collection;
            };
          }

          break;
        }
        case 'morphOne': {
          const model = details.plugin
            ? strapi.plugins[details.plugin].models[details.model]
            : strapi.models[details.model];

          const globalId = `${model.collectionName}_morph`;
          const filter = _.get(model, ['attributes', details.via, 'filter'], 'field');

          loadedModel[name] = function() {
            return this.morphOne(
              GLOBALS[globalId],
              details.via,
              `${definition.collectionName}`
            ).query(qb => {
              qb.where(filter, name);
            });
          };
          break;
        }
        case 'morphMany': {
          const collection = details.plugin
            ? strapi.plugins[details.plugin].models[details.collection]
            : strapi.models[details.collection];

          const globalId = `${collection.collectionName}_morph`;
          const filter = _.get(model, ['attributes', details.via, 'filter'], 'field');

          loadedModel[name] = function() {
            return this.morphMany(
              GLOBALS[globalId],
              details.via,
              `${definition.collectionName}`
            ).query(qb => {
              qb.where(filter, name).orderBy('order');
            });
          };
          break;
        }
        case 'belongsToMorph':
        case 'belongsToManyMorph': {
          const association = _.find(definition.associations, { alias: name });
          const morphAttrInfo = {
            plugin: definition.plugin,
            model: definition.modelName,
            name,
          };
          const morphModelsAndFields = association.related.map(
            getRelatedFieldsOfMorphModel(morphAttrInfo)
          );

          // Define new model.
          const options = {
            requireFetch: false,
            tableName: `${definition.collectionName}_morph`,
            [definition.collectionName]: function() {
              return this.belongsTo(
                GLOBALS[definition.globalId],
                `${definition.collectionName}_id`
              );
            },
            related: function() {
              return this.morphTo(
                name,
                ...association.related.map(morphModel => [
                  GLOBALS[morphModel.globalId],
                  morphModel.collectionName,
                ])
              );
            },
          };

          GLOBALS[options.tableName] = ORM.Model.extend(options);

          // Set polymorphic table name to the main model.
          target[model].morph = GLOBALS[options.tableName];

          // Hack Bookshelf to create a many-to-many polymorphic association.
          // Upload has many Upload_morph that morph to different model.
          const populateFn = qb => {
            qb.where(qb => {
              for (const modelAndFields of morphModelsAndFields) {
                qb.orWhere(qb => {
                  qb.where({
                    [`${morphAttrInfo.name}_type`]: modelAndFields.collectionName,
                  }).whereIn('field', modelAndFields.relatedFields);
                });
              }
            });
          };

          loadedModel[name] = function() {
            if (verbose === 'belongsToMorph') {
              return this.hasOne(
                GLOBALS[options.tableName],
                `${definition.collectionName}_id`
              ).query(populateFn);
            }

            return this.hasMany(
              GLOBALS[options.tableName],
              `${definition.collectionName}_id`
            ).query(populateFn);
          };
          break;
        }
        default: {
          break;
        }
      }
    });

    // Call this callback function after we are done parsing
    // all attributes for relationships-- see below.

    const parseValue = createParser();
    try {
      // External function to map key that has been updated with `columnName`
      const mapper = (params = {}) => {
        Object.keys(params).map(key => {
          const attr = definition.attributes[key] || {};

          params[key] = parseValue(attr.type, params[key]);
        });

        return _.mapKeys(params, (value, key) => {
          const attr = definition.attributes[key] || {};

          return _.isPlainObject(attr) && _.isString(attr['columnName']) ? attr['columnName'] : key;
        });
      };

      // Extract association except polymorphic.
      const associations = definition.associations.filter(
        association => association.nature.toLowerCase().indexOf('morph') === -1
      );
      // Extract polymorphic association.
      const polymorphicAssociations = definition.associations.filter(
        association => association.nature.toLowerCase().indexOf('morph') !== -1
      );

      // Update serialize to reformat data for polymorphic associations.
      loadedModel.serialize = function(options) {
        const attrs = _.clone(this.attributes);

        if (options && options.shallow) {
          return attrs;
        }

        const relations = this.relations;

        componentAttributes.forEach(key => {
          if (!_.has(relations, key)) return;

          const attr = definition.attributes[key];
          const { type } = attr;

          switch (type) {
            case 'component': {
              const { repeatable } = attr;

              const components = relations[key].toJSON().map(el => el.component);

              attrs[key] = repeatable === true ? components : _.first(components) || null;

              break;
            }
            case 'dynamiczone': {
              attrs[key] = relations[key].toJSON().map(el => {
                const componentKey = Object.keys(strapi.components).find(
                  key => strapi.components[key].collectionName === el.component_type
                );

                return {
                  __component: strapi.components[componentKey].uid,
                  ...el.component,
                };
              });

              break;
            }
            default: {
              throw new Error(`Invalid type for attribute ${key}: ${type}`);
            }
          }
        });

        polymorphicAssociations.map(association => {
          // Retrieve relation Bookshelf object.
          const relation = relations[association.alias];

          if (relation) {
            // Extract raw JSON data.
            attrs[association.alias] = relation.toJSON ? relation.toJSON(options) : relation;

            // Retrieve opposite model.
            const model = strapi.db.getModel(
              association.collection || association.model,
              association.plugin
            );

            // Reformat data by bypassing the many-to-many relationship.
            switch (association.nature) {
              case 'oneToManyMorph':
                attrs[association.alias] = attrs[association.alias][model.collectionName] || null;
                break;
              case 'manyToManyMorph':
                attrs[association.alias] = attrs[association.alias].map(
                  rel => rel[model.collectionName]
                );
                break;
              case 'oneMorphToOne': {
                const obj = attrs[association.alias];

                if (obj === undefined || obj === null) {
                  break;
                }

                const contentType = strapi.db.getModelByCollectionName(
                  obj[`${association.alias}_type`]
                );

                attrs[association.alias] = {
                  __contentType: contentType ? contentType.globalId : null,
                  ...obj.related,
                };

                break;
              }
              case 'manyMorphToOne':
              case 'manyMorphToMany':
                attrs[association.alias] = attrs[association.alias].map(obj => {
                  const contentType = strapi.db.getModelByCollectionName(
                    obj[`${association.alias}_type`]
                  );

                  return {
                    __contentType: contentType ? contentType.globalId : null,
                    ...obj.related,
                  };
                });
                break;
              default:
            }
          }
        });

        associations.map(association => {
          const relation = relations[association.alias];

          if (relation) {
            // Extract raw JSON data.
            attrs[association.alias] = relation.toJSON ? relation.toJSON(options) : relation;

            if (_.isArray(association.populate)) {
              const { alias, populate } = association;
              const pickPopulate = entry => _.pick(entry, populate);

              attrs[alias] = _.isArray(attrs[alias])
                ? _.map(attrs[alias], pickPopulate)
                : pickPopulate(attrs[alias]);
            }
          }
        });

        return attrs;
      };

      // Initialize lifecycle callbacks.
      loadedModel.initialize = function() {
        // Load bookshelf plugin arguments from model options
        this.constructor.__super__.initialize.apply(this, arguments);

        this.on('fetching fetching:collection', (instance, attrs, options) => {
          populateFetch(definition, options);
        });

        this.on('saving', (instance, attrs) => {
          instance.attributes = _.assign(instance.attributes, mapper(attrs));
        });

        const formatValue = createFormatter(definition.client);
        function formatEntry(entry) {
          Object.keys(entry.attributes).forEach(key => {
            if (key.startsWith('_strapi_tmp_')) {
              delete entry.attributes[key];
              return;
            }
            const attr = definition.attributes[key] || {};
            entry.attributes[key] = formatValue(attr, entry.attributes[key]);
          });
        }

        this.on('saved fetched fetched:collection', instance => {
          if (Array.isArray(instance.models)) {
            instance.models.forEach(entry => formatEntry(entry));
          } else {
            formatEntry(instance);
          }
        });
      };

      loadedModel.hidden = _.keys(
        _.keyBy(
          _.filter(definition.attributes, (value, key) => {
            if (
              _.has(value, 'columnName') &&
              !_.isEmpty(value.columnName) &&
              value.columnName !== key
            ) {
              return true;
            }
          }),
          'columnName'
        )
      );
      GLOBALS[definition.globalId] = ORM.Model.extend(loadedModel);

      // Expose ORM functions through the `strapi.models[xxx]`
      // or `strapi.plugins[xxx].models[yyy]` object.
      target[model] = _.assign(GLOBALS[definition.globalId], target[model]);

      // Push attributes to be aware of model schema.
      target[model]._attributes = definition.attributes;
      target[model].updateRelations = relations.update;
      target[model].deleteRelations = relations.deleteRelations;
      target[model].privateAttributes = contentTypesUtils.getPrivateAttributes(target[model]);

      return async () => {
        try {
          await buildDatabaseSchema({
            ORM,
            definition,
            loadedModel,
            connection,
            model: target[model],
          });

          await createComponentJoinTables({ definition, ORM });
        } catch (err) {
          if (['ER_TOO_LONG_IDENT'].includes(err.code)) {
            strapi.stopWithError(
              err,
              `A table name is too long. If it is the name of a join table automatically generated by Strapi, you can customise it by adding \`collectionName: "customName"\` in the corresponding model's attribute.`
            );
          }

          strapi.stopWithError(err);
        }
      };
    } catch (err) {
      if (err instanceof TypeError || err instanceof ReferenceError) {
        strapi.stopWithError(err, `Impossible to register the '${model}' model.`);
      }

      strapi.stopWithError(err);
    }
  };

  const finalizeUpdates = [];
  for (const model of _.keys(models)) {
    const finalizeUpdate = await updateModel(model);
    finalizeUpdates.push(finalizeUpdate);
  }

  if (selfFinalize) {
    for (const finalizeUpdate of finalizeUpdates) {
      await finalizeUpdate();
    }
    return [];
  }

  return finalizeUpdates;
};
