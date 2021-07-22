'use strict';

const coreStoreModel = config => ({
  connection: config.get('database.corestoreConnection') || config.get('database.defaultConnection'),
  uid: 'strapi::core-store',
  info: {
    name: 'core_store',
    description: '',
  },
  pluginOptions: {
    'content-manager': {
      visible: false,
    },
    'content-type-builder': {
      visible: false,
    },
  },
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
  globalId: 'StrapiConfigs',
  collectionName: 'core_store',
});

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

      const data = await db.query('core_store').findOne(where);

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

      const data = await db.query('core_store').findOne(where);

      if (data) {
        Object.assign(data, {
          value: JSON.stringify(value) || value.toString(),
          type: (typeof value).toString(),
        });

        await db.query('core_store').update({ id: data.id }, data);
      } else {
        const data = Object.assign({}, where, {
          value: JSON.stringify(value) || value.toString(),
          type: (typeof value).toString(),
          tag,
        });

        await db.query('core_store').create(data);
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

      await db.query('core_store').delete(where);
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
