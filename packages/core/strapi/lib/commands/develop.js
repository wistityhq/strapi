'use strict';

const path = require('path');
const cluster = require('cluster');
const fs = require('fs-extra');
const chokidar = require('chokidar');
const execa = require('execa');
const { getOr } = require('lodash/fp');

const { createLogger } = require('@strapi/logger');
const loadConfiguration = require('../core/app-configuration');
const strapi = require('../index');

/**
 * `$ strapi develop`
 *
 */
module.exports = async function({ build, watchAdmin, polling, browser }) {
  const dir = process.cwd();
  const config = loadConfiguration(dir);
  const logger = createLogger(config.logger, {});

  const adminWatchIgnoreFiles = getOr([], 'server.admin.watchIgnoreFiles')(config);
  const serveAdminPanel = getOr(true, 'server.admin.serveAdminPanel')(config);

  const buildExists = fs.existsSync(path.join(dir, 'build'));
  // Don't run the build process if the admin is in watch mode
  if (build && !watchAdmin && serveAdminPanel && !buildExists) {
    try {
      execa.shellSync('npm run -s build -- --no-optimization', {
        stdio: 'inherit',
      });
    } catch (err) {
      process.exit(1);
    }
  }

  try {
    if (cluster.isMaster) {
      if (watchAdmin) {
        try {
          execa('npm', ['run', '-s', 'strapi', 'watch-admin', '--', '--browser', browser], {
            stdio: 'inherit',
          });
        } catch (err) {
          process.exit(1);
        }
      }

      cluster.on('message', (worker, message) => {
        switch (message) {
          case 'reload':
            logger.info('The server is restarting\n');
            worker.send('isKilled');
            break;
          case 'kill':
            worker.kill();
            cluster.fork();
            break;
          case 'stop':
            worker.kill();
            process.exit(1);
          default:
            return;
        }
      });

      cluster.fork();
    }

    if (cluster.isWorker) {
      const strapiInstance = strapi({
        dir,
        autoReload: true,
        serveAdminPanel: watchAdmin ? false : true,
      });

      watchFileChanges({
        dir,
        strapiInstance,
        watchIgnoreFiles: adminWatchIgnoreFiles,
        polling,
      });

      process.on('message', message => {
        switch (message) {
          case 'isKilled':
            strapiInstance.server.destroy(() => {
              process.send('kill');
            });
            break;
          default:
          // Do nothing.
        }
      });

      return strapiInstance.start();
    }
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
};

/**
 * Init file watching to auto restart strapi app
 * @param {Object} options - Options object
 * @param {string} options.dir - This is the path where the app is located, the watcher will watch the files under this folder
 * @param {Strapi} options.strapi - Strapi instance
 * @param {array} options.watchIgnoreFiles - Array of custom file paths that should not be watched
 */
function watchFileChanges({ dir, strapiInstance, watchIgnoreFiles, polling }) {
  const restart = () => {
    if (strapiInstance.reload.isWatching && !strapiInstance.reload.isReloading) {
      strapiInstance.reload.isReloading = true;
      strapiInstance.reload();
    }
  };

  const watcher = chokidar.watch(dir, {
    ignoreInitial: true,
    usePolling: polling,
    ignored: [
      /(^|[/\\])\../, // dot files
      /tmp/,
      '**/admin',
      '**/admin/**',
      'extensions/**/admin',
      'extensions/**/admin/**',
      '**/documentation',
      '**/documentation/**',
      '**/node_modules',
      '**/node_modules/**',
      '**/plugins.json',
      '**/index.html',
      '**/public',
      '**/public/**',
      '**/*.db*',
      '**/exports/**',
      ...watchIgnoreFiles,
    ],
  });

  watcher
    .on('add', path => {
      strapiInstance.log.info(`File created: ${path}`);
      restart();
    })
    .on('change', path => {
      strapiInstance.log.info(`File changed: ${path}`);
      restart();
    })
    .on('unlink', path => {
      strapiInstance.log.info(`File deleted: ${path}`);
      restart();
    });
}
