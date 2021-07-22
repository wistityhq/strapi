'use strict';

function prefixTest(prefix, dependency) {
  const re = new RegExp(`^(?:@[a-zA-Z0-9-]+/)?${prefix}`, '');
  const r = re.exec(dependency);
  if (!r) {
    return false;
  }
  return r[0];
}

module.exports = (prefix, pkgJSON) => {
  const dependencies = pkgJSON.dependencies;
  return Object.keys(dependencies)
    .map(d => {
      const prefixString = prefixTest(prefix, d);
      if (!prefixString) {
        return null;
      }
      return d.substring(prefixString.length + 1);
    })
    .filter(d => Boolean(d));
};
