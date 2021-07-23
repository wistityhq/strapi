'use strict';

const _ = require('lodash');
const { QUERY_OPERATORS } = require('@strapi/utils');

/**
 * @typedef {object} Schema
 * @property {object} resolvers
 * @property {object} mutation
 * @property {object} query
 * @property {string} definition
 */

/**
 * Merges strapi graphql schema together
 * @param {Schema} object - destination object
 * @param  {Schema[]} sources - source objects to merge into the destination object
 * @returns {Schema}
 */
// todo[v4]: get rid off this
const mergeSchemas = (object, ...sources) => {
  sources.forEach(sub => {
    if (_.isEmpty(sub)) return;
    const { definition = '', query = {}, mutation = {}, resolvers = {} } = sub;

    object.definition += '\n' + definition;
    _.merge(object, {
      query,
      mutation,
      resolvers,
    });
  });

  return object;
};

/**
 * Returns an empty schema
 * @returns {Schema}
 */
// todo[v4] get rid of this
const createDefaultSchema = () => ({
  definition: '',
  query: {},
  mutation: {},
  resolvers: {},
});

const diffResolvers = (object, base) => {
  let newObj = {};

  Object.keys(object).forEach(type => {
    Object.keys(object[type]).forEach(resolver => {
      if (type === 'Query' || type === 'Mutation') {
        if (!_.has(base, [type, resolver])) {
          _.set(newObj, [type, resolver], _.get(object, [type, resolver]));
        }
      } else {
        _.set(newObj, [type, resolver], _.get(object, [type, resolver]));
      }
    });
  });

  return newObj;
};

const convertToParams = params => {
  return Object.keys(params).reduce((acc, current) => {
    const key = current === 'id' ? 'id' : `_${current}`;
    acc[key] = params[current];
    return acc;
  }, {});
};

const convertToQuery = params => {
  const result = {};

  _.forEach(params, (value, key) => {
    if (QUERY_OPERATORS.includes(key)) {
      result[key] = _.isArray(value) ? value.map(convertToQuery) : convertToQuery(value);
    } else if (_.isPlainObject(value)) {
      const flatObject = convertToQuery(value);
      _.forEach(flatObject, (_value, _key) => {
        result[`${key}.${_key}`] = _value;
      });
    } else {
      result[key] = value;
    }
  });

  return result;
};

const amountLimiting = (params = {}) => {
  const { amountLimit } = strapi.plugins.graphql.config;

  if (!amountLimit) return params;

  if (_.isNil(params.limit) || params.limit === -1 || params.limit > amountLimit) {
    params.limit = amountLimit;
  } else if (params.limit < 0) {
    params.limit = 0;
  }

  return params;
};

const nonRequired = type => type.replace('!', '');

const actionExists = ({ resolver, resolverOf }) => {
  if (isResolvablePath(resolverOf)) {
    return true;
  } else if (_.isFunction(resolver)) {
    return true;
  } else if (_.isString(resolver)) {
    return _.isFunction(getActionFn(getActionDetails(resolver)));
  } else {
    throw new Error(
      `Error building query. Expected \`resolver\` as string or a function, or \`resolverOf\` as a string. got ${{
        resolver,
        resolverOf,
      }}`
    );
  }
};

const getAction = resolver => {
  if (!_.isString(resolver)) {
    throw new Error(`Error building query. Expected a string, got ${resolver}`);
  }

  const actionDetails = getActionDetails(resolver);
  const actionFn = getActionFn(actionDetails);

  if (!actionFn) {
    throw new Error(
      `[GraphQL] Cannot find action "${resolver}". Check your graphql configurations.`
    );
  }

  return actionFn;
};

const getActionFn = details => {
  const { controller, action, plugin, api } = details;

  if (plugin) {
    return _.get(strapi.plugins, [_.toLower(plugin), 'controllers', _.toLower(controller), action]);
  }

  return _.get(strapi.api, [_.toLower(api), 'controllers', _.toLower(controller), action]);
};

const getActionDetails = resolver => {
  if (resolver.startsWith('plugins::')) {
    const [, path] = resolver.split('::');
    const [plugin, controller, action] = path.split('.');

    return { plugin, controller, action };
  }

  if (resolver.startsWith('application::')) {
    const [, path] = resolver.split('::');
    const [api, controller, action] = path.split('.');

    return { api, controller, action };
  }

  const args = resolver.split('.');

  if (args.length === 3) {
    const [api, controller, action] = args;
    return { api, controller, action };
  }

  // if direct api access
  if (args.length === 2) {
    const [controller, action] = args;
    return { api: controller, controller, action };
  }

  throw new Error(
    `[GraphQL] Could not find action for resolver "${resolver}". Check your graphql configurations.`
  );
};

const isResolvablePath = path => _.isString(path) && !_.isEmpty(path);

module.exports = {
  diffResolvers,
  mergeSchemas,
  createDefaultSchema,
  convertToParams,
  convertToQuery,
  amountLimiting,
  nonRequired,
  actionExists,
  getAction,
  getActionDetails,
  getActionFn,
  isResolvablePath,
};
