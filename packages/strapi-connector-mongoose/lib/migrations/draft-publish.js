'use strict';

const _ = require('lodash');
const pmap = require('p-map');
const { contentTypes: contentTypesUtils } = require('strapi-utils');

const { PUBLISHED_AT_ATTRIBUTE } = contentTypesUtils.constants;

const BATCH_SIZE = 1000;

const deleteDrafts = async ({ model }) => {
  let lastId;
  const findParams = { [PUBLISHED_AT_ATTRIBUTE]: null };

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (lastId) {
      findParams._id = { $gt: lastId };
    }

    const batch = await model
      .find(findParams, ['id'])
      .sort({ _id: 1 })
      .limit(BATCH_SIZE);

    if (batch.length > 0) {
      lastId = batch[batch.length - 1]._id;
    }

    await pmap(batch, entry => model.deleteRelations(entry), {
      concurrency: 100,
      stopOnError: true,
    });

    if (batch.length < BATCH_SIZE) {
      break;
    }
  }
  await model.deleteMany({ [PUBLISHED_AT_ATTRIBUTE]: null });
};

const getDraftAndPublishMigrationWay = async ({ definition, previousDefinition }) => {
  const previousDraftAndPublish = contentTypesUtils.hasDraftAndPublish(previousDefinition);
  const actualDraftAndPublish = contentTypesUtils.hasDraftAndPublish(definition);

  if (!previousDefinition || previousDraftAndPublish === actualDraftAndPublish) {
    return 'none';
  }
  if (!previousDraftAndPublish && actualDraftAndPublish) {
    return 'enable';
  }
  if (previousDraftAndPublish && !actualDraftAndPublish) {
    return 'disable';
  }
};

const migrateDraftAndPublish = async ({ definition, previousDefinition, model }) => {
  let way = await getDraftAndPublishMigrationWay({ definition, previousDefinition });

  if (way === 'enable') {
    const createdAtCol = _.get(definition, 'timestamps.createdAt', 'createdAt');
    await model
      .aggregate([
        {
          $addFields: {
            [PUBLISHED_AT_ATTRIBUTE]: { $ifNull: [`$${createdAtCol}`, new Date()] },
          },
        },
        {
          $out: definition.collectionName,
        },
      ])
      .exec();
  } else if (way === 'disable') {
    await deleteDrafts({ model });
    await model.updateMany({}, { $unset: { [PUBLISHED_AT_ATTRIBUTE]: '' } }, { strict: false });
  }
};

module.exports = {
  before: migrateDraftAndPublish,
};
