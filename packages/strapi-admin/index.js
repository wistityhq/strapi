'use strict';
/* eslint-disable no-useless-escape */
const path = require('path');
const _ = require('lodash');
const fs = require('fs-extra');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const chalk = require('chalk');
const chokidar = require('chokidar');
// eslint-disable-next-line node/no-extraneous-require
const hasEE = require('strapi/lib/utils/ee');
const getWebpackConfig = require('./webpack.config.js');

const getPkgPath = name => path.dirname(require.resolve(`${name}/package.json`));

function getCustomWebpackConfig(dir, config) {
  const adminConfigPath = path.join(dir, 'admin', 'admin.config.js');

  let webpackConfig = getWebpackConfig({ useEE: hasEE({ dir }), ...config });

  if (fs.existsSync(adminConfigPath)) {
    const adminConfig = require(path.resolve(adminConfigPath));

    if (_.isFunction(adminConfig.webpack)) {
      webpackConfig = adminConfig.webpack(webpackConfig, webpack);

      if (!webpackConfig) {
        console.error(
          `${chalk.red('Error:')} Nothing was returned from your custom webpack configuration`
        );
        process.exit(1);
      }
    }
  }

  return webpackConfig;
}

async function build({ dir, env, options, optimize }) {
  // Create the cache dir containing the front-end files.
  await createCacheDir(dir);

  const cacheDir = path.resolve(dir, '.cache');
  const entry = path.resolve(cacheDir, 'admin', 'src', 'app.js');
  const dest = path.resolve(dir, 'build');
  const config = getCustomWebpackConfig(dir, { entry, dest, env, options, optimize });

  const compiler = webpack(config);

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      let messages;
      if (err) {
        if (!err.message) {
          return reject(err);
        }
        messages = {
          errors: [err.message],
          warnings: [],
        };
      } else {
        messages = stats.toJson({ all: false, warnings: true, errors: true });
      }

      if (messages.errors.length) {
        // Only keep the first error. Others are often indicative
        // of the same problem, but confuse the reader with noise.
        if (messages.errors.length > 1) {
          messages.errors.length = 1;
        }
        return reject(new Error(messages.errors.join('\n\n')));
      }

      return resolve({
        stats,
        warnings: messages.warnings,
      });
    });
  });
}

async function createPluginsJs(plugins, localPlugins, dest) {
  const content = `
const injectReducer = require('./utils/injectReducer').default;
const injectSaga = require('./utils/injectSaga').default;
const useInjectReducer = require('./utils/injectReducer').useInjectReducer;
const useInjectSaga = require('./utils/injectSaga').useInjectSaga;
const { languages } = require('./i18n');

window.strapi = Object.assign(window.strapi || {}, {
  node: MODE || 'host',
  backendURL: BACKEND_URL === '/' ? window.location.origin : BACKEND_URL,
  languages,
  currentLanguage:
  window.localStorage.getItem('strapi-admin-language') ||
  window.navigator.language ||
  window.navigator.userLanguage ||
  'en',
  injectReducer,
  injectSaga,
  useInjectReducer,
  useInjectSaga,
});

module.exports = {
  ${plugins
    .map(name => {
      const shortName = name.replace(/^strapi-plugin-/i, '');
      const req = `require('../../plugins/${name}/admin/src').default`;
      return `'${shortName}': ${req},`;
    })
    .join('\n')}
  ${localPlugins
    .map(name => {
      const shortName = name.replace(/^strapi-plugin-/i, '');
      const req = `require('../../../plugins/${name}/admin/src').default`;
      return `'${shortName}': ${req}`;
    })
    .join(',\n')}
}
  `;

  return fs.writeFile(path.resolve(dest, 'admin', 'src', 'plugins.js'), content);
}

async function clean({ dir }) {
  const buildDir = path.join(dir, 'build');
  const cacheDir = path.join(dir, '.cache');

  fs.removeSync(buildDir);
  fs.removeSync(cacheDir);
}

async function copyPlugin(name, dest) {
  const pkgFilePath = getPkgPath(name);

  const resolveDepPath = (...args) => path.resolve(pkgFilePath, ...args);
  const resolveDest = (...args) => path.resolve(dest, 'plugins', name, ...args);

  const copy = (...args) => {
    return fs.copy(resolveDepPath(...args), resolveDest(...args));
  };

  // Copy the entire admin folder
  await copy('admin');

  // Copy the layout.js if it exists
  if (await fs.exists(path.resolve(pkgFilePath, 'config', 'layout.js'))) {
    await fs.ensureDir(resolveDest('config'));
    await copy('config', 'layout.js');
  }

  await copy('package.json');
}

async function copyAdmin(dest) {
  const adminPath = getPkgPath('strapi-admin');

  // TODO copy ee folders for plugins
  await fs.copy(path.resolve(adminPath, 'ee', 'admin'), path.resolve(dest, 'ee', 'admin'));

  await fs.ensureDir(path.resolve(dest, 'config'));
  await fs.copy(path.resolve(adminPath, 'admin'), path.resolve(dest, 'admin'));
  await fs.copy(
    path.resolve(adminPath, 'config', 'layout.js'),
    path.resolve(dest, 'config', 'layout.js')
  );

  // Copy package.json
  await fs.copy(path.resolve(adminPath, 'package.json'), path.resolve(dest, 'package.json'));
}

async function copyCustomAdmin(src, dest) {
  await fs.copy(src, path.resolve(dest, 'admin'));
}

async function createCacheDir(dir) {
  const cacheDir = path.resolve(dir, '.cache');

  const pkgJSON = require(path.join(dir, 'package.json'));

  const pluginsToCopy = Object.keys(pkgJSON.dependencies).filter(
    dep =>
      dep.startsWith('strapi-plugin') &&
      fs.existsSync(path.resolve(getPkgPath(dep), 'admin', 'src', 'index.js'))
  );

  let localPluginsToCopy = [];
  if (fs.existsSync(path.join(dir, 'plugins'))) {
    localPluginsToCopy = fs
      .readdirSync(path.join(dir, 'plugins'))
      .filter(plugin =>
        fs.existsSync(path.resolve(dir, 'plugins', plugin, 'admin', 'src', 'index.js'))
      );
  }

  // TODO: add logic to avoid copying files if not necessary

  // create .cache dir
  await fs.emptyDir(cacheDir);

  // copy admin core code
  await copyAdmin(cacheDir);

  // copy plugins code
  await Promise.all(pluginsToCopy.map(name => copyPlugin(name, cacheDir)));

  // override admin code with user customizations
  if (fs.pathExistsSync(path.join(dir, 'admin'))) {
    await copyCustomAdmin(path.join(dir, 'admin'), cacheDir);
  }

  // create plugins.js with plugins requires
  await createPluginsJs(pluginsToCopy, localPluginsToCopy, cacheDir);

  // override plugins' admin code with user customizations
  const pluginsToOverride = pluginsToCopy.reduce((acc, current) => {
    const pluginName = current.replace(/^strapi-plugin-/i, '');

    if (fs.pathExistsSync(path.join(dir, 'extensions', pluginName, 'admin'))) {
      acc.push(pluginName);
    }

    return acc;
  }, []);

  await Promise.all(
    pluginsToOverride.map(plugin =>
      copyCustomAdmin(
        path.join(dir, 'extensions', plugin, 'admin'),
        path.join(cacheDir, 'plugins', `strapi-plugin-${plugin}`)
      )
    )
  );
}

async function watchAdmin({ dir, host, port, browser, options }) {
  // Create the cache dir containing the front-end files.
  await createCacheDir(dir);

  const entry = path.join(dir, '.cache', 'admin', 'src', 'app.js');
  const dest = path.join(dir, 'build');
  const env = 'development';

  const args = {
    entry,
    dest,
    env,
    port,
    options,
  };

  const webpackConfig = getCustomWebpackConfig(dir, args);
  const opts = {
    clientLogLevel: 'silent',
    quiet: true,
    open: browser === 'true' ? true : browser,
    publicPath: options.publicPath,
    historyApiFallback: {
      index: options.publicPath,
      disableDotRule: true,
    },
    ...webpack(webpackConfig).options.devServer
  };

  const server = new WebpackDevServer(webpack(webpackConfig), opts);

  server.listen(port, host, function(err) {
    if (err) {
      console.log(err);
    }

    console.log(chalk.green('Starting the development server...'));
    console.log();
    console.log(chalk.green(`Admin development at http://${host}:${port}${opts.publicPath}`));
  });

  watchFiles(dir, options.watchIgnoreFiles);
}

async function watchFiles(dir, ignoreFiles = []) {
  const cacheDir = path.join(dir, '.cache');
  const pkgJSON = require(path.join(dir, 'package.json'));
  const admin = path.join(dir, 'admin');
  const extensionsPath = path.join(dir, 'extensions');

  const appPlugins = Object.keys(pkgJSON.dependencies).filter(
    dep =>
      dep.startsWith('strapi-plugin') &&
      fs.existsSync(path.resolve(getPkgPath(dep), 'admin', 'src', 'index.js'))
  );
  const pluginsToWatch = appPlugins.map(plugin =>
    path.join(extensionsPath, plugin.replace(/^strapi-plugin-/i, ''), 'admin')
  );
  const filesToWatch = [admin, ...pluginsToWatch];

  const watcher = chokidar.watch(filesToWatch, {
    ignoreInitial: true,
    ignorePermissionErrors: true,
    ignored: [...ignoreFiles],
  });

  watcher.on('all', async (event, filePath) => {
    const isExtension = filePath.includes(extensionsPath);
    const pluginName = isExtension ? filePath.replace(extensionsPath, '').split(path.sep)[1] : '';

    const packageName = isExtension ? `strapi-plugin-${pluginName}` : 'strapi-admin';

    const targetPath = isExtension
      ? path.normalize(filePath.split(extensionsPath)[1].replace(pluginName, ''))
      : path.normalize(filePath.split(admin)[1]);

    const destFolder = isExtension
      ? path.join(cacheDir, 'plugins', packageName)
      : path.join(cacheDir, 'admin');

    if (event === 'unlink' || event === 'unlinkDir') {
      const originalFilePathInNodeModules = path.join(
        getPkgPath(packageName),
        isExtension ? '' : 'admin',
        targetPath
      );

      // Remove the file or folder
      // We need to copy the original files when deleting an override one
      try {
        fs.removeSync(path.join(destFolder, targetPath));
      } catch (err) {
        console.log('An error occured while deleting the file', err);
      }

      // Check if the file or folder exists in node_modules
      // If so copy the old one
      if (fs.pathExistsSync(path.resolve(originalFilePathInNodeModules))) {
        try {
          await fs.copy(
            path.resolve(originalFilePathInNodeModules),
            path.join(destFolder, targetPath)
          );

          // The plugins.js file needs to be recreated
          // when we delete either the admin folder
          // the admin/src folder
          // or the plugins.js file
          // since the path are different when developing inside the monorepository or inside an app
          const shouldCopyPluginsJSFile =
            filePath.split('/admin/src').filter(p => !!p).length === 1;

          if (
            (event === 'unlinkDir' && !isExtension && shouldCopyPluginsJSFile) ||
            (!isExtension && filePath.includes('plugins.js'))
          ) {
            await createPluginsJs(appPlugins, path.join(cacheDir));
          }
        } catch (err) {
          // Do nothing
        }
      }
    } else {
      // In any other case just copy the file into the .cache folder
      try {
        await fs.copy(filePath, path.join(destFolder, targetPath));
      } catch (err) {
        console.log(err);
      }
    }
  });
}

module.exports = {
  clean,
  build,
  watchAdmin,
};
