/**
 * Load Modules is the root module loader.
 * This is where all the strapi enviornment is laoded
 * - APIs
 * - Plugins
 * - Hooks
 * - Middlewres
 * - Components
 * - ContentTypes
 */
'use strict';

const loadApis = require('./load-apis');
const loadAdmin = require('./load-admin');

// const loadPlugins = require('./load-plugins');

const loadMiddlewares = require('./load-middlewares');
const loadExtensions = require('./load-extensions');
const loadHooks = require('./load-hooks');
const loadComponents = require('./load-components');

module.exports = async strapi => {
  const [api, admin, /*plugins,*/ middlewares, hook, extensions, components] = await Promise.all([
    loadApis(strapi),
    loadAdmin(strapi),
    // loadPlugins(strapi),
    loadMiddlewares(strapi),
    loadHooks(strapi.config),
    loadExtensions(strapi),
    loadComponents(strapi),
  ]);

  // TODO: move this into the appropriate loaders

  /**
   * Handle plugin extensions
   */
  // merge extensions config folders
  // _.mergeWith(plugins, extensions.merges, (objValue, srcValue, key) => {
  //   // concat routes
  //   if (_.isArray(srcValue) && _.isArray(objValue) && key === 'routes') {
  //     return srcValue.concat(objValue);
  //   }
  // });

  // // overwrite plugins with extensions overwrites
  // extensions.overwrites.forEach(({ path, mod }) => {
  //   _.assign(_.get(plugins, path), mod);
  // });

  return {
    api,
    admin,
    // plugins,
    middlewares,
    hook,
    extensions,
    components,
  };
};
