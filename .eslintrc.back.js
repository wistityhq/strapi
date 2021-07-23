'use strict';

module.exports = {
  extends: [
    'eslint:recommended',
    'prettier',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:node/recommended',
    // 'plugin:jsdoc/recommended',
  ],
  plugins: ['jsdoc'],
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  globals: {
    strapi: false,
  },
  rules: {
    // 'jsdoc/require-jsdoc': [
    //   'warn',
    //   {
    //     publicOnly: true,
    //     require: {
    //       ArrowFunctionExpression: true,
    //       ClassDeclaration: true,
    //       ClassExpression: true,
    //       FunctionDeclaration: true,
    //       FunctionExpression: true,
    //       MethodDefinition: true,
    //     },
    //   },
    // ],
    'node/no-unpublished-require': 'off',
    'require-atomic-updates': 'off',
    'no-process-exit': 'off',
    strict: ['error', 'global'],
    'import/order': 'error',
    'import/no-cycle': 'error',
    'import/no-useless-path-segments': 'error',
    'import/first': 'error',
    'import/extensions': ['error', 'never'],
    'import/newline-after-import': 'error',
    'node/exports-style': ['error', 'module.exports'],
    'node/no-new-require': 'error',
    'node/no-path-concat': 'error',
    'node/no-callback-literal': 'error',
    'node/handle-callback-err': 'error',
    'one-var': ['error', 'never'],
  },
};
