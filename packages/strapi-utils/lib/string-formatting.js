'use strict';
const _ = require('lodash');
const slugify = require('@sindresorhus/slugify');

const nameToSlug = (name, options = { separator: '-' }) => slugify(name, options);

const nameToCollectionName = name => slugify(name, { separator: '_' });

const getCommonBeginning = (...strings) => _.takeWhile(
  strings[0],
  (char, index) => strings.every(string => string[index] === char)
).join('');

const getCommonPath = (...paths)=> {
  const [segments, ...otherSegments] = paths.map(it=>_.split(it, '/'));
  return _.join(
    _.takeWhile(segments, (str, index)=>otherSegments.every(it=>it[index] === str))
    , '/');
};

const escapeQuery = (query, charsToEscape, escapeChar = '\\') => {
  return query
    .split('')
    .reduce(
      (escapedQuery, char) =>
        charsToEscape.includes(char)
          ? `${escapedQuery}${escapeChar}${char}`
          : `${escapedQuery}${char}`,
      ''
    );
};

const stringIncludes = (arr, val) => arr.map(String).includes(String(val));
const stringEquals = (a, b) => String(a) === String(b);

module.exports = {
  nameToSlug,
  nameToCollectionName,
  getCommonBeginning,
  getCommonPath,
  escapeQuery,
  stringIncludes,
  stringEquals,
};
