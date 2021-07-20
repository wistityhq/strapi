module.exports = {
  apps: [
    {
      name: 'strapi-getstarted',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
