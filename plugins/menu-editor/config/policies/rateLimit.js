const lazyRateLimit = {
  get RateLimit() {
    return require('koa2-ratelimit').RateLimit;
  },
};

module.exports = async (ctx, next) => {
  const message = [
    {
      messages: [
        {
          id: 'Auth.form.error.ratelimit',
          message: 'Too many attempts, please try again in a minute.',
        },
      ],
    },
  ];

  return lazyRateLimit.RateLimit.middleware(
    Object.assign(
      {},
      {
        interval: 1 * 60 * 1000,
        max: 5,
        prefixKey: `${ctx.request.url}:${ctx.request.ip}`,
        message,
      },
      strapi.plugins['menu-editor'].config.ratelimit
    )
  )(ctx, next);
};
