'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const _ = require('lodash');
const pluralize = require('pluralize');

/*
 * Set of utils for models
 */
module.exports = {
  /**
   * Initialize to prevent some mistakes
   */

  initialize: cb => {
    cb();
  },

  /**
   * Retrieve the value based on the primary key
   */

  getValuePrimaryKey: (value, defaultKey) => {
    return value[defaultKey] || value.id || value._id;
  },

  /**
   * Find relation nature with verbose
   */

  getNature: ({ attribute, attributeName, modelName }) => {
    const types = {
      current: '',
      other: '',
    };

    const models = strapi.db.getModelsByPluginName(attribute.plugin);

    const pluginModels = Object.values(strapi.plugins).reduce((acc, plugin) => {
      return acc.concat(Object.values(plugin.models));
    }, []);

    const allModels = Object.values(strapi.models).concat(pluginModels);

    if (
      (_.has(attribute, 'collection') && attribute.collection === '*') ||
      (_.has(attribute, 'model') && attribute.model === '*')
    ) {
      if (attribute.model) {
        types.current = 'morphToD';
      } else {
        types.current = 'morphTo';
      }

      // We have to find if there is a model linked to this key
      _.forEach(allModels, model => {
        _.forIn(model.attributes, attribute => {
          if (_.has(attribute, 'via') && attribute.via === attributeName) {
            if (_.has(attribute, 'collection') && attribute.collection === modelName) {
              types.other = 'collection';

              // Break loop
              return false;
            } else if (_.has(attribute, 'model') && attribute.model === modelName) {
              types.other = 'modelD';

              // Break loop
              return false;
            }
          }
        });
      });
    } else if (_.has(attribute, 'via') && _.has(attribute, 'collection')) {
      if (!_.has(models, attribute.collection)) {
        throw new Error(
          `The collection \`${_.upperFirst(
            attribute.collection
          )}\`, used in the attribute \`${attributeName}\` in the model ${_.upperFirst(
            modelName
          )}, is missing from the${
            attribute.plugin ? ' (plugin - ' + attribute.plugin + ')' : ''
          } models`
        );
      }
      const relatedAttribute = models[attribute.collection].attributes[attribute.via];

      if (!relatedAttribute) {
        throw new Error(
          `The attribute \`${attribute.via}\` is missing in the model ${_.upperFirst(
            attribute.collection
          )}${attribute.plugin ? ' (plugin - ' + attribute.plugin + ')' : ''}`
        );
      }

      types.current = 'collection';

      if (
        _.has(relatedAttribute, 'collection') &&
        relatedAttribute.collection !== '*' &&
        _.has(relatedAttribute, 'via')
      ) {
        types.other = 'collection';
      } else if (
        _.has(relatedAttribute, 'collection') &&
        relatedAttribute.collection !== '*' &&
        !_.has(relatedAttribute, 'via')
      ) {
        types.other = 'collectionD';
      } else if (_.has(relatedAttribute, 'model') && relatedAttribute.model !== '*') {
        types.other = 'model';
      } else if (_.has(relatedAttribute, 'collection') || _.has(relatedAttribute, 'model')) {
        types.other = 'morphTo';
      } else {
        throw new Error(
          `The attribute \`${
            attribute.via
          }\` is not correctly configured in the model ${_.upperFirst(attribute.collection)}${
            attribute.plugin ? ' (plugin - ' + attribute.plugin + ')' : ''
          }`
        );
      }
    } else if (_.has(attribute, 'via') && _.has(attribute, 'model')) {
      types.current = 'modelD';

      // We have to find if there is a model linked to this attributeName
      if (!_.has(models, attribute.model)) {
        throw new Error(
          `The model \`${_.upperFirst(
            attribute.model
          )}\`, used in the attribute \`${attributeName}\` in the model ${_.upperFirst(
            modelName
          )}, is missing from the${
            attribute.plugin ? ' (plugin - ' + attribute.plugin + ')' : ''
          } models`
        );
      }
      const reverseAttribute = models[attribute.model].attributes[attribute.via];

      if (!reverseAttribute) {
        throw new Error(
          `The attribute \`${attribute.via}\` is missing in the model ${_.upperFirst(
            attribute.model
          )}${attribute.plugin ? ' (plugin - ' + attribute.plugin + ')' : ''}`
        );
      }

      if (
        _.has(reverseAttribute, 'via') &&
        reverseAttribute.via === attributeName &&
        _.has(reverseAttribute, 'collection') &&
        reverseAttribute.collection !== '*'
      ) {
        types.other = 'collection';
      } else if (_.has(reverseAttribute, 'model') && reverseAttribute.model !== '*') {
        types.other = 'model';
      } else if (_.has(reverseAttribute, 'collection') || _.has(reverseAttribute, 'model')) {
        types.other = 'morphTo';
      } else {
        throw new Error(
          `The attribute \`${
            attribute.via
          }\` is not correctly configured in the model ${_.upperFirst(attribute.model)}${
            attribute.plugin ? ' (plugin - ' + attribute.plugin + ')' : ''
          }`
        );
      }
    } else if (_.has(attribute, 'model')) {
      types.current = 'model';

      // We have to find if they are a model linked to this attributeName
      _.forIn(models, model => {
        _.forIn(model.attributes, attribute => {
          if (_.has(attribute, 'via') && attribute.via === attributeName) {
            if (_.has(attribute, 'collection') && attribute.collection === modelName) {
              types.other = 'collection';

              // Break loop
              return false;
            } else if (_.has(attribute, 'model') && attribute.model === modelName) {
              types.other = 'modelD';

              // Break loop
              return false;
            }
          }
        });
      });
    } else if (_.has(attribute, 'collection')) {
      types.current = 'collectionD';

      // We have to find if they are a model linked to this attributeName
      _.forIn(models, model => {
        _.forIn(model.attributes, attribute => {
          if (_.has(attribute, 'via') && attribute.via === attributeName) {
            if (_.has(attribute, 'collection') && attribute.collection === modelName) {
              types.other = 'collection';

              // Break loop
              return false;
            } else if (_.has(attribute, 'model') && attribute.model === modelName) {
              types.other = 'modelD';

              // Break loop
              return false;
            }
          }
        });
      });
    } else {
      throw new Error(
        `The attribute \`${attributeName}\` is not correctly configured in the model ${_.upperFirst(
          modelName
        )}${attribute.plugin ? ' (plugin - ' + attribute.plugin + ')' : ''}`
      );
    }

    if (types.current === 'collection' && types.other === 'morphTo') {
      return {
        nature: 'manyToManyMorph',
        verbose: 'morphMany',
      };
    } else if (types.current === 'collection' && types.other === 'morphToD') {
      return {
        nature: 'manyToOneMorph',
        verbose: 'morphMany',
      };
    } else if (types.current === 'modelD' && types.other === 'morphTo') {
      return {
        nature: 'oneToManyMorph',
        verbose: 'morphOne',
      };
    } else if (types.current === 'modelD' && types.other === 'morphToD') {
      return {
        nature: 'oneToOneMorph',
        verbose: 'morphOne',
      };
    } else if (types.current === 'morphToD' && types.other === 'collection') {
      return {
        nature: 'oneMorphToMany',
        verbose: 'belongsToMorph',
      };
    } else if (types.current === 'morphToD' && types.other === 'model') {
      return {
        nature: 'oneMorphToOne',
        verbose: 'belongsToMorph',
      };
    } else if (
      types.current === 'morphTo' &&
      (types.other === 'model' || _.has(attribute, 'model'))
    ) {
      return {
        nature: 'manyMorphToOne',
        verbose: 'belongsToManyMorph',
      };
    } else if (
      types.current === 'morphTo' &&
      (types.other === 'collection' || _.has(attribute, 'collection'))
    ) {
      return {
        nature: 'manyMorphToMany',
        verbose: 'belongsToManyMorph',
      };
    } else if (types.current === 'modelD' && types.other === 'model') {
      return {
        nature: 'oneToOne',
        verbose: 'belongsTo',
      };
    } else if (types.current === 'model' && types.other === 'modelD') {
      return {
        nature: 'oneToOne',
        verbose: 'hasOne',
      };
    } else if (
      (types.current === 'model' || types.current === 'modelD') &&
      types.other === 'collection'
    ) {
      return {
        nature: 'manyToOne',
        verbose: 'belongsTo',
      };
    } else if (types.current === 'modelD' && types.other === 'collection') {
      return {
        nature: 'oneToMany',
        verbose: 'hasMany',
      };
    } else if (types.current === 'collection' && types.other === 'model') {
      return {
        nature: 'oneToMany',
        verbose: 'hasMany',
      };
    } else if (types.current === 'collection' && types.other === 'collection') {
      return {
        nature: 'manyToMany',
        verbose: 'belongsToMany',
      };
    } else if (
      (types.current === 'collectionD' && types.other === 'collection') ||
      (types.current === 'collection' && types.other === 'collectionD')
    ) {
      return {
        nature: 'manyToMany',
        verbose: 'belongsToMany',
      };
    } else if (types.current === 'collectionD' && types.other === '') {
      return {
        nature: 'manyWay',
        verbose: 'belongsToMany',
      };
    } else if (types.current === 'model' && types.other === '') {
      return {
        nature: 'oneWay',
        verbose: 'belongsTo',
      };
    }

    return undefined;
  },

  /**
   * Return table name for a collection many-to-many
   */
  getCollectionName: (associationA, associationB) => {
    if (associationA.dominant && _.has(associationA, 'collectionName')) {
      return associationA.collectionName;
    }

    if (associationB.dominant && _.has(associationB, 'collectionName')) {
      return associationB.collectionName;
    }

    return [associationA, associationB]
      .sort((a, b) => {
        if (a.collection === b.collection) {
          if (a.dominant) return 1;
          else return -1;
        }
        return a.collection < b.collection ? -1 : 1;
      })
      .map(table =>
        _.snakeCase(`${pluralize.plural(table.collection)} ${pluralize.plural(table.via)}`)
      )
      .join('__');
  },

  /**
   * Define associations key to models
   */

  defineAssociations: function(model, definition, association, key) {
    try {
      // Initialize associations object
      if (definition.associations === undefined) {
        definition.associations = [];
      }

      // Exclude non-relational attribute
      if (!_.has(association, 'collection') && !_.has(association, 'model')) {
        return;
      }

      // Get relation nature
      let details;

      const targetName = association.model || association.collection || '';

      const targetModel =
        targetName !== '*' ? strapi.db.getModel(targetName, association.plugin) : null;

      const infos = this.getNature({
        attribute: association,
        attributeName: key,
        modelName: model.toLowerCase(),
      });

      if (targetName !== '*') {
        const model = strapi.db.getModel(targetName, association.plugin);
        details = _.get(model, ['attributes', association.via], {});
      }

      // Build associations object
      if (_.has(association, 'collection') && association.collection !== '*') {
        const ast = {
          alias: key,
          type: 'collection',
          targetUid: targetModel.uid,
          collection: association.collection,
          via: association.via || undefined,
          nature: infos.nature,
          autoPopulate: _.get(association, 'autoPopulate', true),
          dominant: details.dominant !== true,
          plugin: association.plugin || undefined,
          filter: details.filter,
          populate: association.populate,
        };

        if (infos.nature === 'manyToMany' && definition.orm === 'bookshelf') {
          ast.tableCollectionName = this.getCollectionName(details, association);
        }

        if (infos.nature === 'manyWay' && definition.orm === 'bookshelf') {
          ast.tableCollectionName =
            _.get(association, 'collectionName') ||
            `${definition.collectionName}__${_.snakeCase(key)}`;
        }
        definition.associations.push(ast);
        return;
      }

      if (_.has(association, 'model') && association.model !== '*') {
        definition.associations.push({
          alias: key,
          type: 'model',
          targetUid: targetModel.uid,
          model: association.model,
          via: association.via || undefined,
          nature: infos.nature,
          autoPopulate: _.get(association, 'autoPopulate', true),
          dominant: details.dominant !== true,
          plugin: association.plugin || undefined,
          filter: details.filter,
          populate: association.populate,
        });
        return;
      }

      const pluginsModels = Object.keys(strapi.plugins).reduce((acc, current) => {
        Object.keys(strapi.plugins[current].models).forEach(entity => {
          Object.keys(strapi.plugins[current].models[entity].attributes).forEach(attribute => {
            const attr = strapi.plugins[current].models[entity].attributes[attribute];

            if ((attr.collection || attr.model || '').toLowerCase() === model.toLowerCase()) {
              acc.push(strapi.plugins[current].models[entity]);
            }
          });
        });

        return acc;
      }, []);

      const appModels = Object.keys(strapi.models).reduce((acc, entity) => {
        Object.keys(strapi.models[entity].attributes).forEach(attribute => {
          const attr = strapi.models[entity].attributes[attribute];

          if ((attr.collection || attr.model || '').toLowerCase() === model.toLowerCase()) {
            acc.push(strapi.models[entity]);
          }
        });

        return acc;
      }, []);

      const componentModels = Object.keys(strapi.components).reduce((acc, entity) => {
        Object.keys(strapi.components[entity].attributes).forEach(attribute => {
          const attr = strapi.components[entity].attributes[attribute];

          if ((attr.collection || attr.model || '').toLowerCase() === model.toLowerCase()) {
            acc.push(strapi.components[entity]);
          }
        });

        return acc;
      }, []);

      const models = _.uniqWith(appModels.concat(pluginsModels, componentModels), _.isEqual);

      definition.associations.push({
        alias: key,
        targetUid: '*',
        type: association.model ? 'model' : 'collection',
        related: models,
        nature: infos.nature,
        autoPopulate: _.get(association, 'autoPopulate', true),
        filter: association.filter,
        populate: association.populate,
      });
    } catch (e) {
      strapi.log.error(
        `Something went wrong in the model \`${_.upperFirst(model)}\` with the attribute \`${key}\``
      );
      strapi.log.error(e);
      strapi.stop();
    }
  },
};
