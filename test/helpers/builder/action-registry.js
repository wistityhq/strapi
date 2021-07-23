'use strict';

const { isFunction, map } = require('lodash/fp');
const modelsUtils = require('../models');

const stringifyDates = object =>
  JSON.parse(
    JSON.stringify(object, (key, value) => {
      if (this[key] instanceof Date) {
        return this[key].toUTCString();
      }
      return value;
    })
  );

const formatFixtures = map(stringifyDates);

module.exports = {
  contentType: {
    create: contentType => {
      let createdModel;

      return {
        async build(ctx) {
          createdModel = await modelsUtils.createContentType(contentType);
          ctx.addModel(createdModel);
        },
        cleanup: () => modelsUtils.deleteContentType(createdModel.uid),
      };
    },

    createBatch: contentTypes => {
      let createdModels = [];

      return {
        async build(ctx) {
          createdModels = await modelsUtils.createContentTypes(contentTypes);
          createdModels.forEach(ctx.addModel);
        },
        async cleanup() {
          for (const model of createdModels) {
            await modelsUtils.deleteContentType(model.uid);
          }
        },
      };
    },

    createMany: contentTypes => {
      const createdModels = [];

      return {
        async build(ctx) {
          for (const contentType of contentTypes) {
            const model = await modelsUtils.createContentType(contentType);

            createdModels.push(model);
            ctx.addModel(model);
          }
        },
        async cleanup() {
          for (const model of createdModels) {
            await modelsUtils.deleteContentType(model.uid);
          }
        },
      };
    },
  },
  component: {
    create: component => {
      let createdModel;

      return {
        async build(ctx) {
          createdModel = await modelsUtils.createComponent(component);
          ctx.addModel(createdModel);
        },
        cleanup: () => modelsUtils.deleteComponent(createdModel.uid),
      };
    },
  },
  fixtures: {
    create(modelName, entries, getFixtures) {
      let createdEntries = [];

      return {
        async build(ctx) {
          createdEntries = formatFixtures(
            await modelsUtils.createFixturesFor(
              modelName,
              isFunction(entries) ? entries(getFixtures()) : entries
            )
          );

          ctx.addFixtures(modelName, createdEntries);
        },
        cleanup: () => modelsUtils.deleteFixturesFor(modelName, createdEntries),
      };
    },
  },
};
