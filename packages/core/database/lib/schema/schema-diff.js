'use strict';

const _ = require('lodash/fp');

const statuses = {
  CHANGED: 'CHANGED',
  UNCHANGED: 'UNCHANGED',
};

// NOTE:We could move the schema to use maps of tables & columns instead of arrays to make it easier to diff
// => this will make the creation a bit more complicated (ordering, Object.values(tables | columns)) -> not a big pbl

const helpers = {
  hasTable(schema, tableName) {
    return schema.tables.findIndex(table => table.name === tableName) !== -1;
  },
  findTable(schema, tableName) {
    return schema.tables.find(table => table.name === tableName);
  },

  hasColumn(table, columnName) {
    return table.columns.findIndex(column => column.name === columnName) !== -1;
  },
  findColumn(table, columnName) {
    return table.columns.find(column => column.name === columnName);
  },

  hasIndex(table, columnName) {
    return table.indexes.findIndex(column => column.name === columnName) !== -1;
  },
  findIndex(table, columnName) {
    return table.indexes.find(column => column.name === columnName);
  },

  hasForeignKey(table, columnName) {
    return table.foreignKeys.findIndex(column => column.name === columnName) !== -1;
  },
  findForeignKey(table, columnName) {
    return table.foreignKeys.find(column => column.name === columnName);
  },
};

const diffProperties = (srcObject, destObject) => {
  const addedProperties = [];
  const updatedProperties = [];
  const unchangedProperties = [];
  const removedProperties = [];

  for (const key in destObject) {
    const value = destObject[key];

    if (_.has(key, srcObject)) {
      const srcValue = srcObject[key];

      if (!_.isEqual(srcValue, value)) {
        updatedProperties.push({ key, oldValue: srcValue, value });
      } else {
        unchangedProperties.push({ key, value });
      }
    } else {
      addedProperties.push({ key, value });
    }
  }

  for (const key in srcObject) {
    const value = srcObject[key];

    if (!_.has(key, destObject)) {
      removedProperties.push({ key, oldValue: value });
    }
  }

  const hasChanged = [addedProperties, updatedProperties, removedProperties].some(
    arr => arr.length > 0
  );

  return {
    status: hasChanged ? statuses.CHANGED : statuses.UNCHANGED,
    diff: {
      name: destObject.name,
      object: destObject,
      // NOTE: maybe put into properties: {}
      added: addedProperties,
      updated: updatedProperties,
      unchanged: unchangedProperties,
      removed: removedProperties,
    },
  };
};

const diffTableColumns = (srcTable, destTable) => {
  /*
  for each column in dest table
    if exists in src table
      diff the two columns
        check properties
      if diff has changes push to changed
      else push to unchanged
    else push to added

  for each column in src table
    if not exists in dest table push to removed

  */

  const addedColumns = [];
  const updatedColumns = [];
  const unchangedColumns = [];
  const removedColumns = [];

  for (const destColumn of destTable.columns) {
    if (helpers.hasColumn(srcTable, destColumn.name)) {
      const srcColumn = helpers.findColumn(srcTable, destColumn.name);
      const { status, diff } = diffProperties(srcColumn, destColumn);

      if (status === statuses.CHANGED) {
        updatedColumns.push(diff);
      } else {
        unchangedColumns.push(srcColumn);
      }
    } else {
      addedColumns.push(destColumn);
    }
  }

  for (const srcColumn of srcTable.columns) {
    if (!helpers.hasColumn(destTable, srcColumn.name)) {
      removedColumns.push(srcColumn);
    }
  }

  const hasChanged = [addedColumns, updatedColumns, removedColumns].some(arr => arr.length > 0);

  return {
    status: hasChanged ? statuses.CHANGED : statuses.UNCHANGED,
    diff: {
      added: addedColumns,
      updated: updatedColumns,
      unchanged: unchangedColumns,
      removed: removedColumns,
    },
  };
};

const diffTableIndexes = (srcTable, destTable) => {
  /*
  for each indexes in dest table
    if exists in src table
      diff the two indexes
        check properties
      if diff has changes push to changed
      else push to unchanged
    else push to added

  for each indexes in src table
    if not exists in dest table push to removed
    */

  const addedIndexes = [];
  const updatedIndexes = [];
  const unchangedIndexes = [];
  const removedIndexes = [];

  for (const destIndex of destTable.indexes) {
    if (helpers.hasIndex(srcTable, destIndex.name)) {
      const srcIndex = helpers.findIndex(srcTable, destIndex.name);
      const { status, diff } = diffProperties(srcIndex, destIndex);

      if (status === statuses.CHANGED) {
        updatedIndexes.push(diff);
      } else {
        unchangedIndexes.push(srcIndex);
      }
    } else {
      addedIndexes.push(destIndex);
    }
  }

  for (const srcIndex of srcTable.indexes) {
    if (!helpers.hasIndex(destTable, srcIndex.name)) {
      removedIndexes.push(srcIndex);
    }
  }

  const hasChanged = [addedIndexes, updatedIndexes, removedIndexes].some(arr => arr.length > 0);

  return {
    status: hasChanged ? statuses.CHANGED : statuses.UNCHANGED,
    diff: {
      added: addedIndexes,
      updated: updatedIndexes,
      unchanged: unchangedIndexes,
      removed: removedIndexes,
    },
  };
};

const diffTableForeignKeys = (srcTable, destTable) => {
  /*
  for each foreginKeys in dest table
    if exists in src table
      diff the two foreginKeys
        check properties
      if diff has changes push to changed
      else push to unchanged
    else push to added

  for each foreginKeys in src table
    if not exists in dest table push to removed
  */

  const addedForeignKeys = [];
  const updatedForeignKeys = [];
  const unchangedForeignKeys = [];
  const removedForeignKeys = [];

  for (const destForeignKey of destTable.foreignKeys) {
    if (helpers.hasForeignKey(srcTable, destForeignKey.name)) {
      const srcForeignKey = helpers.findForeignKey(srcTable, destForeignKey.name);
      const { status, diff } = diffProperties(srcForeignKey, destForeignKey);

      if (status === statuses.CHANGED) {
        updatedForeignKeys.push(diff);
      } else {
        unchangedForeignKeys.push(srcForeignKey);
      }
    } else {
      addedForeignKeys.push(destForeignKey);
    }
  }

  for (const srcForeignKey of srcTable.foreignKeys) {
    if (!helpers.hasForeignKey(destTable, srcForeignKey.name)) {
      removedForeignKeys.push(srcForeignKey);
    }
  }

  const hasChanged = [addedForeignKeys, updatedForeignKeys, removedForeignKeys].some(
    arr => arr.length > 0
  );

  return {
    status: hasChanged ? statuses.CHANGED : statuses.UNCHANGED,
    diff: {
      added: addedForeignKeys,
      updated: updatedForeignKeys,
      unchanged: unchangedForeignKeys,
      removed: removedForeignKeys,
    },
  };
};

const hasChangedStatus = diff => diff.status === statuses.CHANGED;

const diffTables = (srcTable, destTable) => {
  const columnsDiff = diffTableColumns(srcTable, destTable);
  const indexesDiff = diffTableIndexes(srcTable, destTable);
  const foreignKeysDiff = diffTableForeignKeys(srcTable, destTable);

  const hasChanged = [columnsDiff, indexesDiff, foreignKeysDiff].some(hasChangedStatus);

  return {
    status: hasChanged ? statuses.CHANGED : statuses.UNCHANGED,
    diff: {
      name: srcTable.name,
      indexes: indexesDiff.diff,
      foreignKeys: foreignKeysDiff.diff,
      columns: columnsDiff.diff,
    },
  };
};

const diffSchemas = (srcSchema, destSchema) => {
  // NOTE: We could eventually try to detect renames in tables & columns or hint them when making changes
  // TODO: let's try to see how we can avoid restarts completely by applying these dynamically in dev mode

  /*
  for each table in dest
    if exists in src then

      diff two tables

      if diff has changes push to changed
      else push to unchanged
    else push to added

  for each table in src check if it still exists
    if table not in dest push to removed

  */

  const addedTables = [];
  const updatedTables = [];
  const unchangedTables = [];
  const removedTables = [];

  for (const destTable of destSchema.tables) {
    if (helpers.hasTable(srcSchema, destTable.name)) {
      // either changed or unchanged
      const srcTable = helpers.findTable(srcSchema, destTable.name);

      const { status, diff } = diffTables(srcTable, destTable);

      if (status === statuses.CHANGED) {
        updatedTables.push(diff);
      } else {
        unchangedTables.push(srcTable);
      }
    } else {
      addedTables.push(destTable);
    }
  }

  for (const srcTable of srcSchema.tables) {
    if (!helpers.hasTable(destSchema, srcTable.name)) {
      removedTables.push(srcTable);
    }
  }

  const hasChanged = [addedTables, updatedTables, removedTables].some(arr => arr.length > 0);

  return {
    status: hasChanged ? statuses.CHANGED : statuses.UNCHANGED,
    diff: {
      tables: {
        added: addedTables,
        updated: updatedTables,
        unchanged: unchangedTables,
        removed: removedTables,
      },
    },
  };
};

module.exports = {
  diffSchemas,
};
