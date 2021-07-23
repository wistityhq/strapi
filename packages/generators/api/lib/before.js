'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const _ = require('lodash');
const pluralize = require('pluralize');
const { nameToSlug } = require('@strapi/utils');

/**
 * This `before` function is run before generating targets.
 * Validate, configure defaults, get extra dependencies, etc.
 *
 * @param {Object} scope
 * @param {Function} cb
 */

module.exports = (scope, cb) => {
  if (!scope.rootPath || !scope.id) {
    return cb.invalid('Usage: `$ strapi generate:api apiName`');
  }

  // Format `id`.
  const name = scope.name || nameToSlug(scope.id);

  scope.contentTypeKind = scope.args.kind || 'collectionType';

  // `scope.args` are the raw command line arguments.
  _.defaults(scope, {
    name,
    route:
      scope.contentTypeKind === 'singleType'
        ? _.kebabCase(scope.id)
        : _.kebabCase(pluralize(scope.id)),
  });

  let filePath;
  if (scope.args.api) {
    filePath = `./api/${scope.args.api}`;
  } else if (scope.args.plugin) {
    filePath = `./plugins/${scope.args.plugin}`;
  } else if (scope.args.extend) {
    filePath = `./extensions/${scope.args.extend}`;
  } else {
    filePath = `./api/${name}`;
  }

  // Take another pass to take advantage of the defaults absorbed in previous passes.
  _.defaults(scope, {
    filename: `${name}.js`,
    filenameSettings: `${name}.settings.json`,
    filePath,
  });

  // Validate optional attribute arguments.
  const invalidAttributes = [];

  if (_.isPlainObject(scope.args.attributes)) {
    scope.attributes = scope.args.attributes;
  } else {
    // Map attributes and split them for CLI.
    scope.attributes = scope.args.attributes.map(attribute => {
      if (_.isString(attribute)) {
        const parts = attribute.split(':');

        parts[1] = parts[1] || 'string';

        // Handle invalid attributes.
        if (!parts[1] || !parts[0]) {
          invalidAttributes.push('Error: Invalid attribute notation `' + attribute + '`.');
          return;
        }

        return {
          name: _.trim(_.deburr(parts[0].toLowerCase())),
          params: {
            type: _.trim(_.deburr(parts[1].toLowerCase())),
          },
        };
      } else {
        return _.has(attribute, 'params.type') ? attribute : undefined;
      }
    });

    scope.attributes = _.compact(scope.attributes);

    // Handle invalid action arguments.
    // Send back invalidActions.
    if (invalidAttributes.length) {
      return cb.invalid(invalidAttributes);
    }

    // Make sure there aren't duplicates.
    if (
      _(scope.attributes.map(attribute => attribute.name))
        .uniq()
        .valueOf().length !== scope.attributes.length
    ) {
      return cb.invalid('Duplicate attributes not allowed!');
    }

    // Render some stringified code from the action template
    // and make it available in our scope for use later on.
    scope.attributes = scope.attributes.reduce((acc, attribute) => {
      acc[attribute.name] = attribute.params;
      return acc;
    }, {});
  }
  // Set collectionName
  scope.collectionName = _.has(scope.args, 'collectionName')
    ? scope.args.collectionName
    : _.snakeCase(pluralize(name));

  // Set description
  scope.description = _.has(scope.args, 'description') ? scope.args.description : '';

  scope.schema = JSON.stringify(
    {
      collectionName: scope.collectionName,
      info: {
        name: scope.args.displayName || scope.id,
        description: scope.description,
      },
      options: {
        draftAndPublish: scope.args.draftAndPublish === 'true',
        comment: '',
      },
      attributes: scope.attributes,
    },
    null,
    2
  );

  // Trigger callback with no error to proceed.
  return cb.success();
};
