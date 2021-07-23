/**
 * @module metadata
 *
 */

'use strict';

const _ = require('lodash/fp');

const types = require('../types');
const { createRelation } = require('./relations');

class Metadata extends Map {
  add(meta) {
    return this.set(meta.uid, meta);
  }
}

/**
 * Create Metadata from models configurations
 *
 * timestamps => not optional anymore but auto added. Auto added on the content type or in the db layer ?
 *
 * options => options are handled on the layer above. Options convert to fields on the CT
 *
 * filters => not in v1
 *
 * attributes
 *
 * - type
 * - mapping field name - column name
 * - mapping field type - column type
 * - formatter / parser => coming from field type so no
 * - indexes / checks / contstraints
 * - relations => reference to the target model (function or string to avoid circular deps ?)
 *   - name of the LEFT/RIGHT side foreign keys
 *   - name of join table
 *
 * - compo/dz => reference to the components
 * - validators
 * - hooks
 * - default value
 * - required -> should add a not null option instead of the API required
 * - unique -> should add a DB unique option instead of the unique in the API (Unique by locale or something else for example)
 *
 * lifecycles
 *
 * private fields ? => handled on a different layer
 * @param {object[]} models
 * @returns {Metadata}
 */
const createMetadata = (models = []) => {
  // TODO: reorder to make sure we can create everything or delete everything in the right order
  // TODO: allow passing the join config in the attribute
  // TODO: allow passing column config in the attribute
  const metadata = new Metadata();

  // init pass
  for (const model of _.cloneDeep(models)) {
    metadata.add({
      singularName: model.singularName,
      uid: model.uid,
      tableName: model.tableName,
      attributes: {
        // TODO: check if there isn't an attribute with an id already
        id: {
          type: 'increments',
        },
        ...model.attributes,
      },
    });
  }

  // build compos / relations
  for (const meta of metadata.values()) {
    if (hasComponentsOrDz(meta)) {
      const compoLinkModelMeta = createCompoLinkModelMeta(meta);
      meta.componentLink = compoLinkModelMeta;
      metadata.add(compoLinkModelMeta);
    }

    for (const [attributeName, attribute] of Object.entries(meta.attributes)) {
      try {
        if (types.isComponent(attribute.type)) {
          // convert component to relation

          Object.assign(attribute, {
            type: 'relation',
            relation: attribute.repeatable === true ? 'oneToMany' : 'oneToOne',
            target: attribute.component,
            joinTable: {
              name: meta.componentLink.tableName,
              joinColumn: {
                name: 'entity_id',
                referencedColumn: 'id',
              },
              inverseJoinColumn: {
                name: 'component_id',
                referencedColumn: 'id',
              },
              on: {
                field: attributeName,
              },
            },
          });

          continue;
        }

        if (types.isDynamicZone(attribute.type)) {
          continue;
        }

        if (types.isRelation(attribute.type)) {
          // NOTE: also validate

          createRelation(attributeName, attribute, meta, metadata);

          continue;
        }
      } catch (error) {
        throw new Error(
          `Error on attribute ${attributeName} in model ${meta.singularName}(${meta.uid}): ${error.message}`
        );
      }
    }
  }

  return metadata;
};

const hasComponentsOrDz = model => {
  return Object.values(model.attributes).some(
    ({ type }) => types.isComponent(type) || types.isDynamicZone(type)
  );
};

// NOTE: we might just move the compo logic outside this layer too at some point
const createCompoLinkModelMeta = baseModelMeta => {
  return {
    // TODO: make sure there can't be any conflicts with a prefix
    // singularName: 'compo',
    uid: `${baseModelMeta.tableName}_components`,
    tableName: `${baseModelMeta.tableName}_components`,
    attributes: {
      id: {
        type: 'increments',
      },
      entity_id: {
        type: 'integer',
        column: {
          unsigned: true,
        },
      },
      component_id: {
        type: 'integer',
        column: {
          unsigned: true,
        },
      },
      component_type: {
        type: 'string',
      },
      field: {
        type: 'string',
      },
      order: {
        type: 'integer',
        column: {
          unsigned: true,
          defaultTo: [0],
        },
      },
    },
    indexes: [
      {
        name: `${baseModelMeta.tableName}_field_index`,
        columns: ['field'],
      },
      {
        name: `${baseModelMeta.tableName}_component_type_index`,
        columns: ['component_type'],
      },
    ],
    foreignKeys: [
      {
        name: `${baseModelMeta.tableName}_entity_fk`,
        columns: ['entity_id'],
        referencedColumns: ['id'],
        referencedTable: baseModelMeta.tableName,
        onDelete: 'CASCADE',
      },
    ],
  };
};

module.exports = createMetadata;
