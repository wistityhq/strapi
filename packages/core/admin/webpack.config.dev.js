'use strict';

const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const { DuplicateReporterPlugin } = require('duplicate-dependencies-webpack-plugin');
// FIXME
/* eslint-disable import/extensions */
const webpackConfig = require('./webpack.config.js');

module.exports = () => {
  const analyzeBundle = process.env.ANALYZE_BUNDLE;
  const analyzeDuplicateDependencies = process.env.ANALYZE_DEPS;
  const entry = path.join(__dirname, 'admin', 'src');
  const dest = path.join(__dirname, 'build');

  // When running the analyze:bundle command, it needs a production build
  // to display the tree map of modules
  const env = analyzeBundle ? 'production' : 'development';
  const options = {
    backend: 'http://localhost:1337',
    adminPath: '/admin/',
    features: process.env.STRAPI_ADMIN_ENABLED_EE_FEATURES || ['sso'],
  };

  const useEE = process.env.STRAPI_DISABLE_EE === 'true' ? false : true;

  const args = {
    entry,
    dest,
    env,
    options,
    useEE,
  };

  const config = webpackConfig(args);

  if (analyzeBundle) {
    config.plugins.push(new BundleAnalyzerPlugin());
  }

  if (analyzeDuplicateDependencies === 'true') {
    config.plugins.push(new DuplicateReporterPlugin());
  }

  return {
    ...config,
    snapshot: {
      managedPaths: [
        path.resolve(__dirname, '../content-manager'),
        path.resolve(__dirname, '../content-type-builder'),
        path.resolve(__dirname, '../upload'),
        path.resolve(__dirname, '../helper-plugin'),
      ],
      buildDependencies: {
        hash: true,
        timestamp: true,
      },
      module: {
        timestamp: true,
      },
      resolve: {
        timestamp: true,
      },
      resolveBuildDependencies: {
        hash: true,
        timestamp: true,
      },
    },
    devServer: {
      port: 4000,
      clientLogLevel: 'none',
      quiet: true,
      historyApiFallback: {
        index: '/admin/',
        disableDotRule: true,
      },
      open: false,
      openPage: '/admin',
    },
  };
};
