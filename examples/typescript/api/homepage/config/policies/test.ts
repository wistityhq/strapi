module.exports = async (ctx, next) => {
  console.log('in test policy');

  await next();
};
