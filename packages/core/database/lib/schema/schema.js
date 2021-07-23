'use strict';

const types = require('../types');

const createColumn = (name, attribute) => {
  const { type, args = [], ...opts } = getColumnType(attribute);

  return {
    name,
    type,
    args,
    ...opts,
    ...(attribute.column || {}),
    // TODO: allow passing custom params to the DB from the model definition
  };
};

const shouldCreateColumn = attribute => {
  return types.isScalar(attribute.type);
};

const createTable = meta => {
  const table = {
    // TODO: allow passing custom params to the DB from the model definition
    name: meta.tableName,
    indexes: meta.indexes || [],
    foreignKeys: meta.foreignKeys || [],
    columns: [],
  };

  // TODO: handle indexes
  // TODO: handle foreignKeys

  for (const key in meta.attributes) {
    const attribute = meta.attributes[key];

    // TODO: if relation & has a joinColumn -> create it

    if (types.isRelation(attribute.type)) {
      if (attribute.joinColumn && attribute.owner) {
        // TODO: pass uniquness for oneToOne to avoid create more than one to one
        const { name: columnName, referencedColumn, referencedTable } = attribute.joinColumn;
        table.columns.push(
          createColumn(columnName, {
            type: 'integer',
            unsigned: true,
          })
        );

        table.foreignKeys.push({
          // TODO: generate a name
          name: `${columnName}_fk`,
          columns: [columnName],
          referencedTable,
          referencedColumns: [referencedColumn],
          onDelete: 'SET NULL', // NOTE: could allow ocnifguration
        });
      }
    } else if (shouldCreateColumn(attribute)) {
      // TODO: if column is unique then add a unique index outside so we can easily do the diff

      const column = createColumn(key, meta.attributes[key]);

      if (column.unique) {
        table.indexes.push({
          type: 'unique',
          name: `${table.name}_${column.name}_unique`,
          columns: [column.name],
        });
      }

      if (column.primary) {
        table.indexes.push({
          type: 'primary',
          name: `${table.name}_${column.name}_primary`,
          columns: [column.name],
        });
      }

      table.columns.push(column);
    }
  }

  return table;
};

const getColumnType = attribute => {
  if (attribute.columnType) {
    return attribute.columnType;
  }

  switch (attribute.type) {
    case 'increments': {
      return { type: 'increments', args: [{ primary: true }] };
    }
    // We might want to convert email/password to string types before going into the orm with specific validators & transformers
    case 'password':
    case 'email':
    case 'string': {
      return { type: 'string' };
    }
    case 'uid': {
      return {
        type: 'string',
        unique: true,
      };
    }
    case 'richtext':
    case 'text': {
      return {
        type: 'text',
        args: ['longtext'],
      };
    }
    case 'json': {
      return { type: 'jsonb' };
    }
    case 'enumeration': {
      return {
        type: 'enum',
        args: [
          attribute.enum /*,{ useNative: true, existingType: true, enumName: 'foo_type', schemaName: 'public' }*/,
        ],
      };
    }

    case 'integer': {
      return { type: 'integer' };
    }
    case 'biginteger': {
      return { type: 'bigInteger' };
    }
    // TODO: verify usage of double vs float
    case 'float': {
      return { type: 'double', args: [] };
    }
    // TODO: define precision
    case 'decimal': {
      return { type: 'decimal', args: [10, 2] };
    }
    case 'date': {
      return { type: 'date' };
    }
    // TODO: define precision
    case 'time': {
      return { type: 'time', args: [{ precision: 3 }] };
    }
    case 'datetime': {
      return {
        type: 'datetime',
        args: [
          {
            useTz: false,
            precision: 6, // TODO: to define
          },
        ],
      };
    }
    // TODO: handle defaults
    case 'timestamp': {
      return {
        type: 'timestamp',
        args: [
          {
            useTz: false,
            precision: 6, // TODO: to define
          },
        ],
      };
    }
    case 'boolean': {
      return { type: 'boolean' };
    }
    default: {
      throw new Error(`Unknow type ${attribute.type}`);
    }
  }
};

const metadataToSchema = metadata => {
  const schema = {
    tables: [],
    addTable(table) {
      this.tables.push(table);
      return this;
    },
  };

  metadata.forEach(metadata => {
    schema.addTable(createTable(metadata));
  });

  return schema;
};

module.exports = { metadataToSchema, createTable };
