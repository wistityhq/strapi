'use strict';

const coreStoreModel = {
  uid: 'strapi::core-store',
  collectionName: 'strapi_core_store_settings',
  attributes: {
    key: {
      type: 'string',
    },
    value: {
      type: 'text',
    },
    type: {
      type: 'string',
    },
    environment: {
      type: 'string',
    },
    tag: {
      type: 'string',
    },
  },
};

const createCoreStore = ({ environment: defaultEnv, db }) => {
  return (source = {}) => {
    async function get(params = {}) {
      const { key, environment = defaultEnv, type = 'core', name = '', tag = '' } = Object.assign(
        {},
        source,
        params
      );

      const prefix = `${type}${name ? `_${name}` : ''}`;

      const where = {
        key: `${prefix}_${key}`,
        environment,
        tag,
      };

      const data = await db.query('strapi::core-store').findOne({ where });

      if (!data) {
        return null;
      }

      if (
        data.type === 'object' ||
        data.type === 'array' ||
        data.type === 'boolean' ||
        data.type === 'string'
      ) {
        try {
          return JSON.parse(data.value);
        } catch (err) {
          return new Date(data.value);
        }
      } else if (data.type === 'number') {
        return parseFloat(data.value);
      } else {
        return null;
      }
    }

    async function set(params = {}) {
      const { key, value, environment = defaultEnv, type, name, tag = '' } = Object.assign(
        {},
        source,
        params
      );

      const prefix = `${type}${name ? `_${name}` : ''}`;

      const where = {
        key: `${prefix}_${key}`,
        environment,
        tag,
      };

      const data = await db.query('strapi::core-store').findOne({ where });

      if (data) {
        Object.assign(data, {
          value: JSON.stringify(value) || value.toString(),
          type: (typeof value).toString(),
        });



        await db.query('strapi::core-store').update({ where: { id: data.id }, data });
      } else {
        const data = Object.assign({}, where, {
          value: JSON.stringify(value) || value.toString(),
          type: (typeof value).toString(),
          tag,
        });

        await db.query('strapi::core-store').create({ data });
      }
    }

    async function deleteFn(params = {}) {
      const { key, environment = defaultEnv, type, name, tag = '' } = Object.assign(
        {},
        source,
        params
      );

      const prefix = `${type}${name ? `_${name}` : ''}`;

      const where = {
        key: `${prefix}_${key}`,
        environment,
        tag,
      };

      await db.query('strapi::core-store').delete({ where });
    }

    return {
      get,
      set,
      delete: deleteFn,
    };
  };
};

module.exports = {
  coreStoreModel,
  createCoreStore,
};
