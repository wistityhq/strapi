module.exports = {
  query: `
    testQuery: Homepage
  `,
  resolver: {
    Query: {
      testQuery: {
        policies: ['plugins::users-permissions.isAuthenticated'],
        resolver: 'application::homepage.homepage.find',
      },
    },
  },
};
