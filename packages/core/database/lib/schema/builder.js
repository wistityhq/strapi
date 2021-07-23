'use strict';

const debug = require('debug')('@strapi/database');

module.exports = db => ({
  /**
   * Returns a knex schema builder instance
   * @param {string} table - table name
   */
  getSchemaBuilder(table, trx = db.connection) {
    return table.schema ? trx.schema.withSchema(table.schema) : trx.schema;
  },

  /**
   * Creates schema in DB
   * @param {Schema} schema - database schema
   */
  async createSchema(schema) {
    // TODO: ensure database exists;

    await db.connection.transaction(async trx => {
      // create tables without FKs first do avoid ordering issues
      await this.createTables(schema.tables, trx);
    });
  },

  /**
   * Creates a list of tables in a schema
   * @param {KnexInstance} trx
   * @param {Table[]} tables
   */
  async createTables(tables, trx) {
    for (const table of tables) {
      debug(`Creating table: ${table.name}`);
      const schemaBuilder = this.getSchemaBuilder(table, trx);
      await createTable(schemaBuilder, table);
    }

    // create FKs once all the tables exist
    for (const table of tables) {
      debug(`Creating table foreign keys: ${table.name}`);
      const schemaBuilder = this.getSchemaBuilder(table, trx);
      await createTableForeignKeys(schemaBuilder, table);
    }
  },
  /**
   * Drops schema from DB
   * @param {Schema} schema - database schema
   * @param {object} opts
   * @param {boolean} opts.dropDatabase - weather to drop the entire database or simply drop the tables
   */
  async dropSchema(schema, { dropDatabase = false } = {}) {
    if (dropDatabase) {
      // TODO: drop database & return as it will drop everything
      return;
    }

    await db.connection.transaction(async trx => {
      for (const table of schema.tables.reverse()) {
        const schemaBuilder = this.getSchemaBuilder(table, trx);
        await dropTable(schemaBuilder, table);
      }
    });
  },

  /**
   * Applies a schema diff update in the DB
   * @param {*} schemaDiff
   */
  // TODO: implement force option to disable removal in DB
  async updateSchema(schemaDiff) {
    await db.connection.transaction(async trx => {
      await this.createTables(schemaDiff.tables.added, trx);

      // TODO: drop foreign keys targeting delete tables

      for (const table of schemaDiff.tables.removed) {
        debug(`Removing table: ${table.name}`);

        const schemaBuilder = this.getSchemaBuilder(table, trx);
        // TODO: add cascading if possible
        await dropTable(schemaBuilder, table);
      }

      for (const table of schemaDiff.tables.updated) {
        debug(`Updating table: ${table.name}`);
        // alter table
        const schemaBuilder = this.getSchemaBuilder(table, trx);

        await schemaBuilder.alterTable(table.name, tableBuilder => {
          // Delete indexes / fks / columns

          for (const removedIndex of table.indexes.removed) {
            debug(`Dropping index ${removedIndex.name}`);
            dropIndex(tableBuilder, removedIndex);
          }

          for (const updateddIndex of table.indexes.updated) {
            debug(`Dropping updated index ${updateddIndex.name}`);
            dropIndex(tableBuilder, updateddIndex);
          }

          for (const removedForeignKey of table.foreignKeys.removed) {
            debug(`Dropping foreign key ${removedForeignKey.name}`);
            dropForeignKey(tableBuilder, removedForeignKey);
          }

          for (const updatedForeignKey of table.foreignKeys.updated) {
            debug(`Dropping updated foreign key ${updatedForeignKey.name}`);
            dropForeignKey(tableBuilder, updatedForeignKey);
          }

          for (const removedColumn of table.columns.removed) {
            debug(`Dropping column ${removedColumn.name}`);
            dropColumn(tableBuilder, removedColumn);
          }

          // Update existing columns / foreign keys / indexes

          for (const updatedColumn of table.columns.updated) {
            debug(`Updating column ${updatedColumn.name}`);

            // TODO: cleanup diffs for columns
            const { object } = updatedColumn;

            /*
              type -> recreate the type
              args -> recreate the type
              unsigned
                if changed then recreate the type
                if removed then check if old value was true -> recreate the type else do nothing
              defaultTo
                reapply the default to previous data
              notNullable
                if null to not null we need a default value to migrate the data
            */

            createColumn(tableBuilder, object).alter();
          }

          for (const updatedForeignKey of table.foreignKeys.updated) {
            debug(`Recreating updated foreign key ${updatedForeignKey.name}`);
            createForeignKey(tableBuilder, updatedForeignKey);
          }

          for (const updatedIndex of table.indexes.updated) {
            debug(`Recreating updated index ${updatedIndex.name}`);
            createIndex(tableBuilder, updatedIndex);
          }

          for (const addedColumn of table.columns.added) {
            debug(`Creating column ${addedColumn.name}`);
            createColumn(tableBuilder, addedColumn);
          }

          for (const addedForeignKey of table.foreignKeys.added) {
            debug(`Creating foreign keys ${addedForeignKey.name}`);
            createForeignKey(tableBuilder, addedForeignKey);
          }

          for (const addedIndex of table.indexes.added) {
            debug(`Creating index ${addedIndex.name}`);
            createIndex(tableBuilder, addedIndex);
          }
        });
      }
    });
  },
});

/**
 *  Creates a foreign key on a table
 * @param {Knex.TableBuilder} tableBuilder
 * @param {ForeignKey} foreignKey
 */
const createForeignKey = (tableBuilder, foreignKey) => {
  const { name, columns, referencedColumns, referencedTable, onDelete, onUpdate } = foreignKey;

  const constraint = tableBuilder
    .foreign(columns, name)
    .references(referencedColumns)
    .inTable(referencedTable);

  if (onDelete) {
    constraint.onDelete(onDelete);
  }

  if (onUpdate) {
    constraint.onUpdate(onUpdate);
  }
};

/**
 * Drops a foreign key from a table
 * @param {Knex.TableBuilder} tableBuilder
 * @param {ForeignKey} foreignKey
 */
const dropForeignKey = (tableBuilder, foreignKey) => {
  const { name, columns } = foreignKey;

  tableBuilder.dropForeign(columns, name);
};

/**
 * Creates an index on a table
 * @param {Knex.TableBuilder} tableBuilder
 * @param {Index} index
 */
const createIndex = (tableBuilder, index) => {
  const { type, columns, name } = index;

  switch (type) {
    case 'primary': {
      return tableBuilder.primary(columns, name);
    }
    case 'unique': {
      return tableBuilder.unique(columns, name);
    }
    default: {
      return tableBuilder.index(columns, name, type);
    }
  }
};

/**
 * Drops an index from table
 * @param {Knex.TableBuilder} tableBuilder
 * @param {Index} index
 */
const dropIndex = (tableBuilder, index) => {
  const { type, columns, name } = index;

  switch (type) {
    case 'primary': {
      return tableBuilder.dropPrimary(name);
    }
    case 'unique': {
      return tableBuilder.dropUnique(columns, name);
    }
    default: {
      return tableBuilder.dropIndex(columns, name);
    }
  }
};

/**
 * Creates a column in a table
 * @param {Knex.TableBuilder} tableBuilder
 * @param {Column} column
 */
const createColumn = (tableBuilder, column) => {
  const { type, name, args = [], defaultTo, unsigned, notNullable } = column;

  const col = tableBuilder[type](name, ...args);

  if (unsigned) {
    col.unsigned();
  }

  if (defaultTo) {
    // TODO: allow some raw default values
    col.defaultTo(...[].concat(defaultTo));
  }

  if (notNullable) {
    col.notNullable();
  } else {
    col.nullable();
  }

  return col;
};

/**
 * Drops a column from a table
 * @param {Knex.TableBuilder} tableBuilder
 * @param {Column} column
 */
const dropColumn = (tableBuilder, column) => {
  tableBuilder.dropColumn(column.name);
};

/**
 * Creates a table in a database
 * @param {SchemaBuilder} schemaBuilder
 * @param {Table} table
 */
const createTable = async (schemaBuilder, table) => {
  if (await schemaBuilder.hasTable(table.name)) {
    throw new Error(`Table already exists ${table.name}`);
  }

  await schemaBuilder.createTable(table.name, tableBuilder => {
    // columns
    (table.columns || []).forEach(column => createColumn(tableBuilder, column));

    // indexes
    (table.indexes || []).forEach(index => createIndex(tableBuilder, index));
  });
};

/**
 * Creates a table foreign keys constraints
 * @param {SchemaBuilder} schemaBuilder
 * @param {Table} table
 */
const createTableForeignKeys = async (schemaBuilder, table) => {
  // foreign keys
  await schemaBuilder.table(table.name, tableBuilder => {
    (table.foreignKeys || []).forEach(foreignKey => createForeignKey(tableBuilder, foreignKey));
  });
};

/**
 * Drops a table from a database
 * @param {Knex.SchemaBuilder} schemaBuilder
 * @param {Table} table
 */
const dropTable = (schemaBuilder, table) => schemaBuilder.dropTableIfExists(table.name);
