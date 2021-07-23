'use strict';

const _ = require('lodash/fp');

const types = require('../types');
const { createField } = require('../fields');

const GROUP_OPERATORS = ['$and', '$or'];
const OPERATORS = [
  '$not',
  '$in',
  '$notIn',
  '$eq',
  '$ne',
  '$gt',
  '$gte',
  '$lt',
  '$lte',
  '$null',
  '$notNull',
  '$between',
  // '$like',
  // '$regexp',
  '$startsWith',
  '$endsWith',
  '$contains',
  '$notContains',
];

const ARRAY_OPERATORS = ['$in', '$notIn', '$between'];

const createPivotJoin = (qb, joinTable, alias, tragetMeta) => {
  const joinAlias = qb.getAlias();
  qb.join({
    alias: joinAlias,
    referencedTable: joinTable.name,
    referencedColumn: joinTable.joinColumn.name,
    rootColumn: joinTable.joinColumn.referencedColumn,
    rootTable: alias,
    on: joinTable.on,
  });

  const subAlias = qb.getAlias();
  qb.join({
    alias: subAlias,
    referencedTable: tragetMeta.tableName,
    referencedColumn: joinTable.inverseJoinColumn.referencedColumn,
    rootColumn: joinTable.inverseJoinColumn.name,
    rootTable: joinAlias,
  });

  return subAlias;
};

const createJoin = (ctx, { alias, attributeName, attribute }) => {
  const { db, qb } = ctx;

  if (attribute.type !== 'relation') {
    throw new Error(`Cannot join on non relational field ${attributeName}`);
  }

  const tragetMeta = db.metadata.get(attribute.target);

  const joinColumn = attribute.joinColumn;

  if (joinColumn) {
    const subAlias = qb.getAlias();
    qb.join({
      alias: subAlias,
      referencedTable: tragetMeta.tableName,
      referencedColumn: joinColumn.referencedColumn,
      rootColumn: joinColumn.name,
      rootTable: alias,
    });
    return subAlias;
  }

  const joinTable = attribute.joinTable;
  if (joinTable) {
    return createPivotJoin(qb, joinTable, alias, tragetMeta);
  }

  // NOTE: using the joinColumn / joinTable syntax we don't really care about the relation type here
  switch (attribute.relation) {
    case 'oneToOne': {
      break;
    }
    case 'oneToMany': {
      break;
    }
    case 'manyToOne': {
      break;
    }
    case 'manyToMany': {
      break;
    }

    // TODO: polymorphic relations
    // TODO: components -> they are converted to relation so not needed either
  }

  return alias;
};

// TODO: convert field names to columns names
const processOrderBy = (orderBy, ctx) => {
  const { db, uid, qb, alias = qb.alias } = ctx;

  if (typeof orderBy === 'string') {
    const attribute = db.metadata.get(uid).attributes[orderBy];

    if (!attribute) {
      throw new Error(`Attribute ${orderBy} not found on model ${uid}`);
    }

    return [{ column: `${alias}.${orderBy}` }];
  }

  if (Array.isArray(orderBy)) {
    return orderBy.flatMap(value => processOrderBy(value, ctx));
  }

  if (_.isPlainObject(orderBy)) {
    return Object.entries(orderBy).flatMap(([key, direction]) => {
      const value = orderBy[key];
      const attribute = db.metadata.get(uid).attributes[key];

      if (!attribute) {
        throw new Error(`Attribute ${key} not found on model ${uid}`);
      }

      if (attribute.type === 'relation') {
        // TODO: pass down some filters (e.g published at)
        const subAlias = createJoin(ctx, { alias, uid, attributeName: key, attribute });

        return processOrderBy(value, {
          db,
          qb,
          alias: subAlias,
          uid: attribute.target,
        });
      }

      if (types.isScalar(attribute.type)) {
        return { column: `${alias}.${key}`, order: direction };
      }

      throw new Error(`You cannot order on ${attribute.type} types`);
    });
  }

  throw new Error('Invalid orderBy syntax');
};

const isOperator = key => OPERATORS.includes(key);

const processWhere = (where, ctx, depth = 0) => {
  if (depth === 0 && !_.isPlainObject(where)) {
    throw new Error('Where must be an object');
  }

  const processNested = (where, ctx) => {
    if (!_.isPlainObject(where)) {
      return where;
    }

    return processWhere(where, ctx, depth + 1);
  };

  const { db, uid, qb, alias = qb.alias } = ctx;

  const filters = {};

  // for each key in where
  for (const key in where) {
    const value = where[key];
    const attribute = db.metadata.get(uid).attributes[key];

    // if operator $and $or then loop over them
    if (GROUP_OPERATORS.includes(key)) {
      filters[key] = value.map(sub => processNested(sub, ctx));
      continue;
    }

    if (key === '$not') {
      filters[key] = processNested(value, ctx);
      continue;
    }

    if (isOperator(key)) {
      if (depth == 0) {
        throw new Error(
          `Only $and, $or and $not can by used as root level operators. Found ${key}.`
        );
      }

      filters[key] = processNested(value, ctx);
      continue;
    }

    if (!attribute) {
      // TODO: if targeting a column name instead of an attribute

      // if key as an alias don't add one
      if (key.indexOf('.') >= 0) {
        filters[key] = processNested(value, ctx);
      } else {
        filters[`${alias || qb.alias}.${key}`] = processNested(value, ctx);
      }
      continue;

      // throw new Error(`Attribute ${key} not found on model ${uid}`);
    }

    // move to if else to check for scalar / relation / components & throw for other types
    if (attribute.type === 'relation') {
      // TODO: support shortcut like { role: X } => {role: { id: X }}

      // TODO: pass down some filters (e.g published at)

      // attribute

      const subAlias = createJoin(ctx, { alias, uid, attributeName: key, attribute });

      let nestedWhere = processNested(value, {
        db,
        qb,
        alias: subAlias,
        uid: attribute.target,
      });

      if (!_.isPlainObject(nestedWhere) || isOperator(_.keys(nestedWhere)[0])) {
        nestedWhere = { [`${subAlias}.id`]: nestedWhere };
      }

      // TODO: use a better merge logic (push to $and when collisions)
      Object.assign(filters, nestedWhere);

      continue;
    }

    if (types.isScalar(attribute.type)) {
      // TODO: convert attribute name to column name
      // TODO: cast to DB type
      filters[`${alias || qb.alias}.${key}`] = processNested(value, ctx);
      continue;
    }

    throw new Error(`You cannot filter on ${attribute.type} types`);
  }

  return filters;
};

const applyOperator = (qb, column, operator, value) => {
  if (Array.isArray(value) && !ARRAY_OPERATORS.includes(operator)) {
    return qb.where(subQB => {
      value.forEach(subValue =>
        subQB.orWhere(innerQB => {
          applyOperator(innerQB, column, operator, subValue);
        })
      );
    });
  }

  switch (operator) {
    case '$not': {
      qb.whereNot(qb => applyWhereToColumn(qb, column, value));
      break;
    }

    case '$in': {
      qb.whereIn(column, _.castArray(value));
      break;
    }

    case '$notIn': {
      qb.whereNotIn(column, _.castArray(value));
      break;
    }

    case '$eq': {
      if (value === null) {
        qb.whereNull(column);
        break;
      }

      qb.where(column, value);
      break;
    }
    case '$ne': {
      if (value === null) {
        qb.whereNotNull(column);
        break;
      }

      qb.where(column, '<>', value);
      break;
    }
    case '$gt': {
      qb.where(column, '>', value);
      break;
    }
    case '$gte': {
      qb.where(column, '>=', value);
      break;
    }
    case '$lt': {
      qb.where(column, '<', value);
      break;
    }
    case '$lte': {
      qb.where(column, '<=', value);
      break;
    }
    case '$null': {
      // TODO: make this better
      if (value) {
        qb.whereNull(column);
      }
      break;
    }
    case '$notNull': {
      if (value) {
        qb.whereNotNull(column);
      }

      break;
    }
    case '$between': {
      qb.whereBetween(column, value);
      break;
    }
    // case '$regexp': {
    //   // TODO:
    //
    // break;
    // }
    // // string
    // // TODO: use $case to make it case insensitive
    // case '$like': {
    //   qb.where(column, 'like', value);
    // break;
    // }

    // TODO: add casting logic
    case '$startsWith': {
      qb.where(column, 'like', `${value}%`);
      break;
    }
    case '$endsWith': {
      qb.where(column, 'like', `%${value}`);
      break;
    }
    case '$contains': {
      // TODO: handle insensitive

      qb.where(column, 'like', `%${value}%`);
      break;
    }

    case '$notContains': {
      // TODO: handle insensitive
      qb.whereNot(column, 'like', `%${value}%`);
      break;
    }

    // TODO: json operators

    // TODO: relational operators every/some/exists/size ...

    default: {
      throw new Error(`Undefined operator ${operator}`);
    }
  }
};

const applyWhereToColumn = (qb, column, columnWhere) => {
  if (!_.isPlainObject(columnWhere)) {
    if (Array.isArray(columnWhere)) {
      return qb.whereIn(column, columnWhere);
    }

    return qb.where(column, columnWhere);
  }

  // TODO: Transform into if has($in, value) then to handle cases with two keys doing one thing (like $contains with $case)
  Object.keys(columnWhere).forEach(operator => {
    const value = columnWhere[operator];

    applyOperator(qb, column, operator, value);
  });
};

const applyWhere = (qb, where) => {
  if (Array.isArray(where)) {
    return qb.where(subQB => where.forEach(subWhere => applyWhere(subQB, subWhere)));
  }

  if (!_.isPlainObject(where)) {
    throw new Error('Where must be an object');
  }

  Object.keys(where).forEach(key => {
    const value = where[key];

    if (key === '$and') {
      return qb.where(subQB => {
        value.forEach(v => applyWhere(subQB, v));
      });
    }

    if (key === '$or') {
      return qb.where(subQB => {
        value.forEach(v => subQB.orWhere(inner => applyWhere(inner, v)));
      });
    }

    if (key === '$not') {
      return qb.whereNot(qb => applyWhere(qb, value));
    }

    applyWhereToColumn(qb, key, value);
  });
};

// TODO: allow for more conditions
const applyJoin = (qb, join) => {
  const {
    method = 'leftJoin',
    alias,
    referencedTable,
    referencedColumn,
    rootColumn,
    rootTable = this.alias,
    on,
  } = join;

  qb[method]({ [alias]: referencedTable }, inner => {
    inner.on(`${rootTable}.${rootColumn}`, `${alias}.${referencedColumn}`);

    if (on) {
      for (const key in on) {
        inner.onVal(`${alias}.${key}`, on[key]);
      }
    }
  });
};

const applyJoins = (qb, joins) => joins.forEach(join => applyJoin(qb, join));

/**
 * Converts and prepares the query for populate
 *
 * @param {boolean|string[]|object} populate populate param
 * @param {object} ctx query context
 * @param {object} ctx.db database instance
 * @param {object} ctx.qb query builder instance
 * @param {string} ctx.uid model uid
 */
const processPopulate = (populate, ctx) => {
  const { qb, db, uid } = ctx;
  const meta = db.metadata.get(uid);

  let populateMap = {};

  if (populate === false) {
    return null;
  }

  if (Array.isArray(populate)) {
    for (const key of populate) {
      const [root, ...rest] = key.split('.');

      if (rest.length > 0) {
        populateMap[root] = {
          populate: rest,
        };
      } else {
        populateMap[root] = true;
      }
    }
  } else {
    populateMap = populate;
  }

  if (!_.isPlainObject(populateMap)) {
    throw new Error('Populate must be an object');
  }

  const finalPopulate = {};
  for (const key in populateMap) {
    const attribute = meta.attributes[key];

    if (!attribute) {
      throw new Error(`Cannot populate unknown field ${key}`);
    }

    if (!types.isRelation(attribute.type)) {
      throw new Error(`Invalid populate field. Expected a relation, got ${attribute.type}`);
    }

    // TODO: make sure necessary columns are present for future populate queries
    qb.addSelect('id');

    finalPopulate[key] = populateMap[key];
  }

  return finalPopulate;
};

const applyPopulate = async (results, populate, ctx) => {
  // TODO: cleanup code
  // TODO: create aliases for pivot columns
  // TODO: optimize depth to avoid overfetching

  const { db, uid, qb } = ctx;
  const meta = db.metadata.get(uid);

  for (const key in populate) {
    // TODO: Omit limit & offset in v1 to avoid needing a query per result (too many queries would ipact the performances a lot)
    const populateValue = _.pick(
      ['select', 'count', 'where', 'populate', 'orderBy'],
      populate[key]
    );

    // TODO: handle count for join columns
    const isCount = populateValue.count === true;

    const attribute = meta.attributes[key];

    const targetMeta = db.metadata.get(attribute.target);

    const fromTargetRow = rowOrRows => fromRow(targetMeta, rowOrRows);

    if (attribute.relation === 'oneToOne' || attribute.relation === 'manyToOne') {
      if (attribute.joinColumn) {
        const {
          name: joinColumnName,
          referencedColumn: referencedColumnName,
        } = attribute.joinColumn;

        const referencedValues = _.uniq(
          results.map(r => r[joinColumnName]).filter(value => !_.isNull(value))
        );

        if (_.isEmpty(referencedValues)) {
          results.forEach(result => {
            result[key] = null;
          });

          continue;
        }

        const rows = await db.entityManager
          .createQueryBuilder(targetMeta.uid)
          .init(populateValue)
          .addSelect(`${qb.alias}.${referencedColumnName}`)
          .where({ [referencedColumnName]: referencedValues })
          .execute({ mapResults: false });

        const map = _.groupBy(referencedColumnName, rows);

        results.forEach(result => {
          result[key] = fromTargetRow(_.first(map[result[joinColumnName]]));
        });

        continue;
      }

      if (attribute.joinTable) {
        const { joinTable } = attribute;

        const qb = db.entityManager.createQueryBuilder(targetMeta.uid);

        const {
          name: joinColumnName,
          referencedColumn: referencedColumnName,
        } = joinTable.joinColumn;

        const alias = qb.getAlias();

        if (isCount) {
          const rows = await qb
            .init(populateValue)
            .join({
              alias: alias,
              referencedTable: joinTable.name,
              referencedColumn: joinTable.inverseJoinColumn.name,
              rootColumn: joinTable.inverseJoinColumn.referencedColumn,
              rootTable: qb.alias,
              on: joinTable.on,
            })
            .select([`${alias}.${joinColumnName}`, qb.raw('count(*) AS count')])
            .where({
              [`${alias}.${joinColumnName}`]: results.map(r => r[referencedColumnName]),
            })
            .groupBy(`${alias}.${joinColumnName}`)
            .execute({ mapResults: false });

          const map = rows.reduce((map, row) => {
            map[row[joinColumnName]] = { count: row.count };
            return map;
          }, {});

          results.forEach(result => {
            result[key] = map[result[referencedColumnName]] || { count: 0 };
          });

          continue;
        }

        const rows = await qb
          .init(populateValue)
          .join({
            alias: alias,
            referencedTable: joinTable.name,
            referencedColumn: joinTable.inverseJoinColumn.name,
            rootColumn: joinTable.inverseJoinColumn.referencedColumn,
            rootTable: qb.alias,
            on: joinTable.on,
          })
          .addSelect(`${alias}.${joinColumnName}`)
          .where({
            [`${alias}.${joinColumnName}`]: results.map(r => r[referencedColumnName]),
          })
          .execute({ mapResults: false });

        const map = _.groupBy(joinColumnName, rows);

        results.forEach(result => {
          result[key] = fromTargetRow(_.first(map[result[referencedColumnName]]));
        });

        continue;
      }

      continue;
    } else if (attribute.relation === 'oneToMany') {
      if (attribute.joinColumn) {
        const {
          name: joinColumnName,
          referencedColumn: referencedColumnName,
        } = attribute.joinColumn;

        const referencedValues = _.uniq(
          results.map(r => r[joinColumnName]).filter(value => !_.isNull(value))
        );

        if (_.isEmpty(referencedValues)) {
          results.forEach(result => {
            result[key] = null;
          });
          continue;
        }

        const rows = await db.entityManager
          .createQueryBuilder(targetMeta.uid)
          .init(populateValue)
          .addSelect(`${qb.alias}.${referencedColumnName}`)
          .where({ [referencedColumnName]: referencedValues })
          .execute({ mapResults: false });

        const map = _.groupBy(referencedColumnName, rows);

        results.forEach(result => {
          result[key] = fromTargetRow(map[result[joinColumnName]] || []);
        });

        continue;
      }

      if (attribute.joinTable) {
        const { joinTable } = attribute;

        const qb = db.entityManager.createQueryBuilder(targetMeta.uid);

        const {
          name: joinColumnName,
          referencedColumn: referencedColumnName,
        } = joinTable.joinColumn;

        const alias = qb.getAlias();

        if (isCount) {
          const rows = await qb
            .init(populateValue)
            .join({
              alias: alias,
              referencedTable: joinTable.name,
              referencedColumn: joinTable.inverseJoinColumn.name,
              rootColumn: joinTable.inverseJoinColumn.referencedColumn,
              rootTable: qb.alias,
              on: joinTable.on,
            })
            .select([`${alias}.${joinColumnName}`, qb.raw('count(*) AS count')])
            .where({
              [`${alias}.${joinColumnName}`]: results.map(r => r[referencedColumnName]),
            })
            .groupBy(`${alias}.${joinColumnName}`)
            .execute({ mapResults: false });

          const map = rows.reduce((map, row) => {
            map[row[joinColumnName]] = { count: row.count };
            return map;
          }, {});

          results.forEach(result => {
            result[key] = map[result[referencedColumnName]] || { count: 0 };
          });

          continue;
        }

        const rows = await qb
          .init(populateValue)
          .join({
            alias: alias,
            referencedTable: joinTable.name,
            referencedColumn: joinTable.inverseJoinColumn.name,
            rootColumn: joinTable.inverseJoinColumn.referencedColumn,
            rootTable: qb.alias,
            on: joinTable.on,
          })
          .addSelect(`${alias}.${joinColumnName}`)
          .where({
            [`${alias}.${joinColumnName}`]: results.map(r => r[referencedColumnName]),
          })
          .execute({ mapResults: false });

        const map = _.groupBy(joinColumnName, rows);

        results.forEach(r => {
          r[key] = fromTargetRow(map[r[referencedColumnName]] || []);
        });
        continue;
      }

      continue;
    } else if (attribute.relation === 'manyToMany') {
      const { joinTable } = attribute;

      const qb = db.entityManager.createQueryBuilder(targetMeta.uid);

      const { name: joinColumnName, referencedColumn: referencedColumnName } = joinTable.joinColumn;

      const alias = qb.getAlias();

      if (isCount) {
        const rows = await qb
          .init(populateValue)
          .join({
            alias: alias,
            referencedTable: joinTable.name,
            referencedColumn: joinTable.inverseJoinColumn.name,
            rootColumn: joinTable.inverseJoinColumn.referencedColumn,
            rootTable: qb.alias,
            on: joinTable.on,
          })
          .select([`${alias}.${joinColumnName}`, qb.raw('count(*) AS count')])
          .where({
            [`${alias}.${joinColumnName}`]: results.map(r => r[referencedColumnName]),
          })
          .groupBy(`${alias}.${joinColumnName}`)
          .execute({ mapResults: false });

        const map = rows.reduce((map, row) => {
          map[row[joinColumnName]] = { count: row.count };
          return map;
        }, {});

        results.forEach(result => {
          result[key] = map[result[referencedColumnName]] || { count: 0 };
        });

        continue;
      }

      const rows = await qb
        .init(populateValue)
        .join({
          alias: alias,
          referencedTable: joinTable.name,
          referencedColumn: joinTable.inverseJoinColumn.name,
          rootColumn: joinTable.inverseJoinColumn.referencedColumn,
          rootTable: qb.alias,
          on: joinTable.on,
        })
        .addSelect(`${alias}.${joinColumnName}`)
        .where({
          [`${alias}.${joinColumnName}`]: results.map(r => r[referencedColumnName]),
        })
        .execute({ mapResults: false });

      const map = _.groupBy(joinColumnName, rows);

      results.forEach(result => {
        result[key] = fromTargetRow(map[result[referencedColumnName]] || []);
      });

      continue;
    }
  }
};

const fromRow = (metadata, row) => {
  if (Array.isArray(row)) {
    return row.map(singleRow => fromRow(metadata, singleRow));
  }

  const { attributes } = metadata;

  if (_.isNil(row)) {
    return null;
  }

  const obj = {};

  for (const column in row) {
    // to field Name
    const attributeName = column;

    if (!attributes[attributeName]) {
      // ignore value that are not related to an attribute (join columns ...)
      continue;
    }

    const attribute = attributes[attributeName];

    if (types.isScalar(attribute.type)) {
      // TODO: we convert to column name
      // TODO: handle default value too
      // TODO: format data & use dialect to know which type they support (json particularly)

      const field = createField(attribute.type, attribute);

      // TODO: validate data on creation
      // field.validate(data[attributeName]);
      const val = row[column] === null ? null : field.fromDB(row[column]);

      obj[attributeName] = val;
    }

    if (types.isRelation(attribute.type)) {
      obj[attributeName] = row[column];
    }
  }

  return obj;
};

module.exports = {
  applyWhere,
  processWhere,
  applyJoins,
  applyJoin,
  processOrderBy,
  processPopulate,
  applyPopulate,
  fromRow,
};
