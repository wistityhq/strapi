/**
 * Build queries and mutation resolvers
 */

'use strict';

const _ = require('lodash');
const compose = require('koa-compose');

const { policy: policyUtils } = require('@strapi/utils');
const {
  convertToParams,
  convertToQuery,
  amountLimiting,
  getAction,
  getActionDetails,
  isResolvablePath,
} = require('./utils');

const buildMutation = (mutationName, config) => {
  const { resolver, resolverOf, transformOutput = _.identity, isShadowCrud = false } = config;

  if (_.isFunction(resolver) && !isResolvablePath(resolverOf)) {
    throw new Error(
      `Cannot create mutation "${mutationName}". Missing "resolverOf" option with custom resolver.`
    );
  }

  const policiesMiddleware = compose(getPolicies(config));

  // custom resolvers
  if (_.isFunction(resolver)) {
    return async (root, options = {}, graphqlContext, info) => {
      const ctx = buildMutationContext({ options, graphqlContext, isShadowCrud });

      await policiesMiddleware(ctx);
      graphqlContext.context = ctx;

      return resolver(root, options, graphqlContext, info);
    };
  }

  const action = getAction(resolver);

  return async (root, options = {}, graphqlContext) => {
    const ctx = buildMutationContext({ options, graphqlContext, isShadowCrud });

    await policiesMiddleware(ctx);

    const values = await action(ctx);
    const result = ctx.body !== undefined ? ctx.body : values;

    if (_.isError(result)) {
      throw result;
    }

    return transformOutput(result);
  };
};

const buildMutationContext = ({ options, graphqlContext, isShadowCrud }) => {
  const { context } = graphqlContext;

  const ctx = cloneKoaContext(context);

  if (options.input && options.input.where) {
    ctx.params = convertToParams(options.input.where || {});
  } else {
    ctx.params = {};
  }

  if (options.input && options.input.data) {
    ctx.request.body = options.input.data || {};
  } else {
    ctx.request.body = options;
  }

  if (isShadowCrud) {
    ctx.query = convertToParams(_.omit(options, 'input'));
  }

  return ctx;
};

const buildQuery = (queryName, config) => {
  const { resolver } = config;

  try {
    validateResolverOption(config);
  } catch (error) {
    throw new Error(`Cannot create query "${queryName}": ${error.message}`);
  }

  const policiesMiddleware = compose(getPolicies(config));

  // custom resolvers
  if (_.isFunction(resolver)) {
    return async (root, options = {}, graphqlContext, info) => {
      const { ctx, opts } = buildQueryContext({ options, graphqlContext });

      await policiesMiddleware(ctx);
      graphqlContext.context = ctx;

      return resolver(root, opts, graphqlContext, info);
    };
  }

  const action = getAction(resolver);

  return async (root, options = {}, graphqlContext) => {
    const { ctx } = buildQueryContext({ options, graphqlContext });

    // duplicate context
    await policiesMiddleware(ctx);

    const values = await action(ctx);
    const result = ctx.body !== undefined ? ctx.body : values;

    if (_.isError(result)) {
      throw result;
    }

    return result;
  };
};

const validateResolverOption = config => {
  const { resolver, resolverOf, policies } = config;

  if (_.isFunction(resolver) && !isResolvablePath(resolverOf)) {
    throw new Error(`Missing "resolverOf" option with custom resolver.`);
  }

  if (!_.isUndefined(policies) && (!Array.isArray(policies) || !_.every(policies, _.isString))) {
    throw new Error('Policies option must be an array of string.');
  }

  return true;
};

const cloneKoaContext = ctx => {
  return Object.assign(ctx.app.createContext(_.clone(ctx.req), _.clone(ctx.res)), {
    state: {
      ...ctx.state,
    },
  });
};

const buildQueryContext = ({ options, graphqlContext }) => {
  const { context } = graphqlContext;
  const _options = _.cloneDeep(options);

  const ctx = cloneKoaContext(context);

  const opts = amountLimiting(_options);

  ctx.query = {
    ...convertToParams(_.omit(opts, 'where')),
    ...convertToQuery(opts.where),
  };

  ctx.params = convertToParams(opts);

  return { ctx, opts };
};

/**
 * Checks if a resolverPath (resolver or resovlerOf) might be resolved
 */
const getPolicies = config => {
  const { resolver, policies = [], resolverOf } = config;

  const { api, plugin } = config['_metadatas'] || {};

  const policyFns = [];

  const { controller, action, plugin: pathPlugin } = isResolvablePath(resolverOf)
    ? getActionDetails(resolverOf)
    : getActionDetails(resolver);

  const globalPolicy = policyUtils.globalPolicy({
    controller,
    action,
    plugin: pathPlugin,
  });

  policyFns.push(globalPolicy);

  if (strapi.plugins['users-permissions']) {
    policies.unshift('plugins::users-permissions.permissions');
  }

  policies.forEach(policy => {
    const policyFn = policyUtils.get(policy, plugin, api);
    policyFns.push(policyFn);
  });

  return policyFns;
};

module.exports = {
  buildQuery,
  buildMutation,
};
