'use strict';

/**
 * Returns a single type service to handle default core-api actions
 */
const createSingleTypeService = ({ model, strapi, utils }) => {
  const { uid } = model;
  const { sanitizeInput, getFetchParams } = utils;

  return {
    /**
     * Returns singleType content
     *
     * @return {Promise}
     */
    find({ params } = {}) {
      return strapi.entityService.find(uid, { params: getFetchParams(params) });
    },

    /**
     * Creates or updates a singleType content
     *
     * @return {Promise}
     */
    async createOrUpdate({ params, data, files } = {}) {
      const entity = await this.find({ params });

      const sanitizedData = sanitizeInput(data);

      if (!entity) {
        const count = await strapi.query(uid).count();
        if (count >= 1) {
          throw strapi.errors.badRequest('singleType.alreadyExists');
        }

        return strapi.entityService.create(uid, { params, data: sanitizedData, files });
      } else {
        return strapi.entityService.update(uid, entity.id, {
          params,
          data: sanitizedData,
          files,
        });
      }
    },

    /**
     * Deletes the singleType content
     *
     * @return {Promise}
     */
    async delete({ params } = {}) {
      const entity = await this.find({ params });

      if (!entity) return;

      return strapi.entityService.delete(uid, entity.id);
    },
  };
};

module.exports = createSingleTypeService;
