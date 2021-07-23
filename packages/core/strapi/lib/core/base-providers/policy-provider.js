'use strict';

module.exports = policiesDefinition => {
  const provider = {};
  const policies = new Map(Object.entries(policiesDefinition));

  Object.assign(provider, {
    has(policyName) {
      return policies.has(policyName);
    },
    get(policyName) {
      return policies.get(policyName);
    },
    getAll() {
      return Object.fromEntries(policies);
    },
    get size() {
      return policies.size;
    },
  });

  return provider;
};
