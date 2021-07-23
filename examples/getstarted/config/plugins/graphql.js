module.exports = ({ env }) => ({
  amountLimit: 50,
  depthLimit: 10,
  apolloServer: {
    tracing: true,
  },
});
