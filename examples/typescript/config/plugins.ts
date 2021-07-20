module.exports = ({ env }) => ({
  graphql: {
    amountLimit: 50,
    depthLimit: 10,
    apolloServer: {
      tracing: true,
    },
  },
});
