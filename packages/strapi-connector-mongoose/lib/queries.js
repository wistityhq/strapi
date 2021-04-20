'use strict';
/**
 * Implementation of model queries for mongo
 */

const _ = require('lodash');
const { prop, omit } = require('lodash/fp');
const { convertRestQueryParams, buildQuery } = require('strapi-utils');
const { contentTypes: contentTypesUtils } = require('strapi-utils');
const mongoose = require('mongoose');

const populateQueries = require('./utils/populate-queries');

const { PUBLISHED_AT_ATTRIBUTE, DP_PUB_STATES } = contentTypesUtils.constants;
const { findComponentByGlobalId } = require('./utils/helpers');
const { handleDatabaseError } = require('./utils/errors');
const utils = require('./utils')();

const hasPK = (obj, model) => _.has(obj, model.primaryKey) || _.has(obj, 'id');
const getPK = (obj, model) => (_.has(obj, model.primaryKey) ? obj[model.primaryKey] : obj.id);
const pickCountFilters = omit(['sort', 'limit', 'start']);

module.exports = ({ model, strapi }) => {
  const assocKeys = model.associations.map(ast => ast.alias);
  const componentKeys = Object.keys(model.attributes).filter(key =>
    ['component', 'dynamiczone'].includes(model.attributes[key].type)
  );
  const hasDraftAndPublish = contentTypesUtils.hasDraftAndPublish(model);

  const excludedKeys = assocKeys.concat(componentKeys);

  const defaultPopulate = (options = {}) =>
    model.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => {
        const assocModel = strapi.db.getModelByAssoc(ast);
        const populate = {
          path: ast.alias,
          options: { publicationState: options.publicationState },
        };

        if (
          contentTypesUtils.hasDraftAndPublish(assocModel) &&
          DP_PUB_STATES.includes(options.publicationState)
        ) {
          populate.match = _.merge(
            populate.match,
            populateQueries.publicationState[options.publicationState]
          );
        }

        return populate;
      });

  const pickRelations = values => {
    return _.pick(values, assocKeys);
  };

  const omitExernalValues = values => {
    return _.omit(values, excludedKeys);
  };

  const wrapErrors = fn => async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      return handleDatabaseError(error);
    }
  };

  const hasValidPrimaryKey = params => {
    if (_.has(params, model.primaryKey)) {
      return utils.isMongoId(params[model.primaryKey]);
    }

    return true;
  };

  async function createComponents(entry, values, { isDraft, session = null } = {}) {
    if (componentKeys.length === 0) return;

    for (let key of componentKeys) {
      const attr = model.attributes[key];
      const { type } = attr;

      if (type === 'component') {
        const { component, required = false, repeatable = false } = attr;

        const componentModel = strapi.components[component];

        if (!isDraft && required === true && !_.has(values, key)) {
          const err = new Error(`Component ${key} is required`);
          err.status = 400;
          throw err;
        }

        if (!_.has(values, key)) continue;

        const componentValue = values[key];

        if (repeatable === true) {
          const components = await Promise.all(
            componentValue.map(value => {
              return strapi.query(component).create(value, { session });
            })
          );

          const componentsArr = components.map(componentEntry => ({
            kind: componentModel.globalId,
            ref: componentEntry.id,
          }));

          entry[key] = componentsArr;
          await entry.save({ session });
        } else {
          if (componentValue === null) continue;

          const componentEntry = await strapi.query(component).create(componentValue, { session });
          entry[key] = [
            {
              kind: componentModel.globalId,
              ref: componentEntry.id,
            },
          ];
          await entry.save({ session });
        }
      }

      if (type === 'dynamiczone') {
        const { required = false } = attr;

        if (!isDraft && required === true && !_.has(values, key)) {
          const err = new Error(`Dynamiczone ${key} is required`);
          err.status = 400;
          throw err;
        }

        if (!_.has(values, key)) continue;

        const dynamiczoneValues = values[key];

        const dynamiczones = await Promise.all(
          dynamiczoneValues.map(value => {
            const component = value.__component;
            return strapi
              .query(component)
              .create(value, { session })
              .then(entity => {
                return {
                  __component: value.__component,
                  entity,
                };
              });
          })
        );

        const componentsArr = dynamiczones.map(({ __component, entity }) => {
          const componentModel = strapi.components[__component];

          return {
            kind: componentModel.globalId,
            ref: entity.id,
          };
        });

        entry[key] = componentsArr;
        await entry.save({ session });
      }
    }
  }

  async function updateComponents(entry, values, { session = null } = {}) {
    if (componentKeys.length === 0) return;

    const updateOrCreateComponent = async ({ componentUID, value }) => {
      // check if value has an id then update else create
      const query = strapi.query(componentUID);
      if (hasPK(value, query.model)) {
        return query.update(
          {
            [query.model.primaryKey]: getPK(value, query.model),
          },
          value,
          { session }
        );
      }
      return query.create(value, { session });
    };

    for (let key of componentKeys) {
      // if key isn't present then don't change the current component data
      if (!_.has(values, key)) continue;

      const attr = model.attributes[key];
      const { type } = attr;

      if (type === 'component') {
        const { component: componentUID, repeatable = false } = attr;

        const componentModel = strapi.components[componentUID];
        const componentValue = values[key];

        if (repeatable === true) {
          await deleteOldComponents(entry, componentValue, {
            key,
            componentModel,
            session,
          });

          const components = await Promise.all(
            componentValue.map(value => updateOrCreateComponent({ componentUID, value }))
          );
          const componentsArr = components.map(component => ({
            kind: componentModel.globalId,
            ref: component.id,
          }));

          entry[key] = componentsArr;
          await entry.save({ session });
        } else {
          await deleteOldComponents(entry, componentValue, {
            key,
            componentModel,
            session,
          });

          if (componentValue === null) continue;

          const component = await updateOrCreateComponent({
            componentUID,
            value: componentValue,
          });

          entry[key] = [
            {
              kind: componentModel.globalId,
              ref: component.id,
            },
          ];
          await entry.save({ session });
        }
      }

      if (type === 'dynamiczone') {
        const dynamiczoneValues = values[key];

        await deleteDynamicZoneOldComponents(entry, dynamiczoneValues, {
          key,
          session,
        });

        const dynamiczones = await Promise.all(
          dynamiczoneValues.map(value => {
            const componentUID = value.__component;
            return updateOrCreateComponent({ componentUID, value }).then(entity => {
              return {
                componentUID,
                entity,
              };
            });
          })
        );

        const componentsArr = dynamiczones.map(({ componentUID, entity }) => {
          const componentModel = strapi.components[componentUID];

          return {
            kind: componentModel.globalId,
            ref: entity.id,
          };
        });

        entry[key] = componentsArr;
        await entry.save({ session });
      }
    }
    return;
  }

  async function deleteDynamicZoneOldComponents(entry, values, { key, session = null }) {
    const idsToKeep = values.reduce((acc, value) => {
      const component = value.__component;
      const componentModel = strapi.components[component];
      if (hasPK(value, componentModel)) {
        acc.push({
          id: getPK(value, componentModel).toString(),
          componentUID: componentModel.uid,
        });
      }

      return acc;
    }, []);

    const allIds = []
      .concat(entry[key] || [])
      .filter(el => el.ref)
      .map(el => ({
        id: el.ref._id.toString(),
        componentUID: findComponentByGlobalId(el.kind).uid,
      }));

    // verify the provided ids are realted to this entity.
    idsToKeep.forEach(({ id, componentUID }) => {
      if (!allIds.find(el => el.id === id && el.componentUID === componentUID)) {
        const err = new Error(
          `Some of the provided components in ${key} are not related to the entity`
        );
        err.status = 400;
        throw err;
      }
    });

    const idsToDelete = allIds.reduce((acc, { id, componentUID }) => {
      if (!idsToKeep.find(el => el.id === id && el.componentUID === componentUID)) {
        acc.push({
          id,
          componentUID,
        });
      }
      return acc;
    }, []);

    if (idsToDelete.length > 0) {
      const deleteMap = idsToDelete.reduce((map, { id, componentUID }) => {
        if (!_.has(map, componentUID)) {
          map[componentUID] = [id];
          return map;
        }

        map[componentUID].push(id);
        return map;
      }, {});

      await Promise.all(
        Object.keys(deleteMap).map(componentUID => {
          return strapi
            .query(componentUID)
            .delete({ [`${model.primaryKey}_in`]: deleteMap[componentUID] }, { session });
        })
      );
    }
  }

  async function deleteOldComponents(
    entry,
    componentValue,
    { key, componentModel, session = null }
  ) {
    const componentArr = Array.isArray(componentValue) ? componentValue : [componentValue];

    const idsToKeep = componentArr
      .filter(val => hasPK(val, componentModel))
      .map(val => getPK(val, componentModel));

    const allIds = []
      .concat(entry[key] || [])
      .filter(el => el.ref)
      .map(el => el.ref._id);

    // verify the provided ids are related to this entity.
    idsToKeep.forEach(id => {
      if (allIds.findIndex(currentId => currentId.toString() === id.toString()) === -1) {
        const err = new Error(
          `Some of the provided components in ${key} are not related to the entity`
        );
        err.status = 400;
        throw err;
      }
    });

    const idsToDelete = allIds.reduce((acc, id) => {
      if (idsToKeep.includes(id.toString())) return acc;
      return acc.concat(id);
    }, []);

    if (idsToDelete.length > 0) {
      await strapi
        .query(componentModel.uid)
        .delete({ [`${model.primaryKey}_in`]: idsToDelete }, { session });
    }
  }

  async function deleteComponents(entry, { session = null } = {}) {
    if (componentKeys.length === 0) return;

    for (let key of componentKeys) {
      const attr = model.attributes[key];
      const { type } = attr;

      if (type === 'component') {
        const { component } = attr;
        const componentModel = strapi.components[component];

        if (Array.isArray(entry[key]) && entry[key].length > 0) {
          const idsToDelete = entry[key].map(el => el.ref);
          await strapi
            .query(componentModel.uid)
            .delete({ [`${model.primaryKey}_in`]: idsToDelete }, { session });
        }
      }

      if (type === 'dynamiczone') {
        if (Array.isArray(entry[key]) && entry[key].length > 0) {
          const idsToDelete = entry[key].map(el => ({
            componentUID: findComponentByGlobalId(el.kind).uid,
            id: el.ref,
          }));

          const deleteMap = idsToDelete.reduce((map, { id, componentUID }) => {
            if (!_.has(map, componentUID)) {
              map[componentUID] = [id];
              return map;
            }

            map[componentUID].push(id);
            return map;
          }, {});

          await Promise.all(
            Object.keys(deleteMap).map(componentUID => {
              return strapi.query(componentUID).delete(
                {
                  [`${model.primaryKey}_in`]: deleteMap[componentUID],
                },
                { session }
              );
            })
          );
        }
      }
    }
  }

  function find(params, populate, { session = null } = {}) {
    const filters = convertRestQueryParams(params);
    const populateOpt = populate || defaultPopulate({ publicationState: filters.publicationState });

    return buildQuery({
      model,
      filters,
      populate: populateOpt,
      session,
    }).then(results => results.map(result => (result ? result.toObject() : null)));
  }

  async function findOne(params, populate, { session = null } = {}) {
    if (!hasValidPrimaryKey(params)) {
      return null;
    }

    const entries = await find({ ...params, _limit: 1 }, populate, { session });
    return entries[0] || null;
  }

  function count(params, { session = null } = {}) {
    const filters = pickCountFilters(convertRestQueryParams(params));

    return buildQuery({ model, filters, session }).count();
  }

  async function create(values, { session = null } = {}) {
    // Extract values related to relational data.
    const relations = pickRelations(values);
    const data = omitExernalValues(values);

    if (hasDraftAndPublish) {
      data[PUBLISHED_AT_ATTRIBUTE] = _.has(values, PUBLISHED_AT_ATTRIBUTE)
        ? values[PUBLISHED_AT_ATTRIBUTE]
        : new Date();
    }

    /*
      Create entry with no-relational data.
      Note that it is mongoose requirement that you **must** pass an array as
      the first parameter to `create()` if you want to specify options.
      https://mongoosejs.com/docs/api.html#model_Model.create
    */
    const [entry] = await model.create([data], { session });
    const isDraft = contentTypesUtils.isDraft(entry, model);
    await createComponents(entry, values, { session, isDraft });

    // Create relational data and return the entry.
    return model.updateRelations(
      {
        [model.primaryKey]: getPK(entry, model),
        values: relations,
      },
      { session }
    );
  }

  async function update(params, values, { session = null } = {}) {
    if (!hasValidPrimaryKey(params)) {
      return null;
    }

    const entry = await model.findOne(params).session(session);

    if (!entry) {
      const err = new Error('entry.notFound');
      err.status = 404;
      throw err;
    }

    // Extract values related to relational data.
    const relations = pickRelations(values);
    const data = omitExernalValues(values);

    // update components first in case it fails don't update the entity
    await updateComponents(entry, values, { session });
    // Update entry with no-relational data.
    await entry.updateOne(data, { session });

    // Update relational data and return the entry.
    return model.updateRelations(Object.assign(params, { values: relations }), { session });
  }

  async function deleteMany(params, { session = null } = {}) {
    if (params[model.primaryKey]) {
      if (!utils.isMongoId(params[model.primaryKey])) {
        return null;
      }

      const entries = await find({ ...params, _limit: 1 }, null, { session });
      if (entries.length > 0) {
        return deleteOne(entries[0][model.primaryKey], { session });
      }
      return null;
    }

  const entries = await find(params, null, { session });
  return Promise.all(entries.map(entry => deleteOne(entry[model.primaryKey], { session })));
  }

  async function deleteOne(id, { session = null } = {}) {
    if (!utils.isMongoId(id)) {
      return null;
    }

    const entry = await model
      .findOneAndRemove({ [model.primaryKey]: id }, { session })
      .populate(defaultPopulate());

    if (!entry) {
      const err = new Error('entry.notFound');
      err.status = 404;
      throw err;
    }

    await deleteComponents(entry, { session });

    await model.deleteRelations(entry, { session });

    return entry.toObject ? entry.toObject() : null;
  }

  function search(params, populate, { session = null } = {}) {
    const filters = convertRestQueryParams(_.omit(params, '_q'));
    const populateOpt = populate || defaultPopulate({ publicationState: filters.publicationState });

    return buildQuery({
      model,
      filters,
      searchParam: params._q,
      populate: populateOpt,
      session,
    }).then(results => results.map(result => (result ? result.toObject() : null)));
  }

  function countSearch(params, { session = null } = {}) {
    const countParams = omit(['_q'], params);
    const filters = pickCountFilters(convertRestQueryParams(countParams));

    return buildQuery({
      model,
      filters,
      searchParam: params._q,
      session,
    }).count();
  }

  async function fetchRelationCounters(attribute, entitiesIds = []) {
    const assoc = model.associations.find(assoc => assoc.alias === attribute);

    switch (prop('nature', assoc)) {
      case 'oneToMany': {
        const assocModel = strapi.db.getModelByAssoc(assoc);
        return assocModel
          .aggregate()
          .match({ [assoc.via]: { $in: entitiesIds.map(mongoose.Types.ObjectId) } })
          .group({
            _id: `$${assoc.via}`,
            count: { $sum: 1 },
          })
          .project({ _id: 0, id: '$_id', count: 1 });
      }
      case 'manyWay': {
        return model
          .aggregate()
          .match({ [model.primaryKey]: { $in: entitiesIds.map(mongoose.Types.ObjectId) } })
          .project({ _id: 0, id: '$_id', count: { $size: { $ifNull: [`$${assoc.alias}`, []] } } });
      }
      case 'manyToMany': {
        if (assoc.dominant) {
          return model
            .aggregate()
            .match({ [model.primaryKey]: { $in: entitiesIds.map(mongoose.Types.ObjectId) } })
            .project({
              _id: 0,
              id: '$_id',
              count: { $size: { $ifNull: [`$${assoc.alias}`, []] } },
            });
        }
        const assocModel = strapi.db.getModelByAssoc(assoc);
        return assocModel
          .aggregate()
          .match({ [assoc.via]: { $in: entitiesIds.map(mongoose.Types.ObjectId) } })
          .unwind(assoc.via)
          .group({ _id: `$${assoc.via}`, count: { $sum: 1 } })
          .project({ _id: 0, id: '$_id', count: 1 });
      }
      default: {
        return [];
      }
    }
  }

  return {
    findOne,
    find,
    create: wrapErrors(create),
    update: wrapErrors(update),
    delete: deleteMany,
    count,
    search,
    countSearch,
    fetchRelationCounters,
  };
};
