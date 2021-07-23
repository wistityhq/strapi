'use strict';

const path = require('path');
const fse = require('fs-extra');
const _ = require('lodash');
const { isConfigurable } = require('../../utils/attributes');

module.exports = function createSchemaHandler(infos) {
  const { category, modelName, plugin, uid, dir, filename, schema } = infos;

  const initialState = {
    modelName,
    plugin,
    category,
    uid,
    dir,
    filename,
    schema: schema || {
      info: {},
      options: {},
      attributes: {},
    },
  };

  const state = _.cloneDeep(initialState);

  // always keep it the same to rollback
  Object.freeze(initialState.schema);

  let modified = false;
  let deleted = false;

  return {
    get modelName() {
      return initialState.modelName;
    },

    get plugin() {
      return initialState.plugin;
    },

    get category() {
      return initialState.category;
    },

    get kind() {
      return _.get(state.schema, 'kind', 'collectionType');
    },

    get uid() {
      return state.uid;
    },

    get writable() {
      return _.get(state, 'plugin') !== 'admin';
    },

    setUID(val) {
      modified = true;

      state.uid = val;
      return this;
    },

    setDir(val) {
      modified = true;

      state.dir = val;
      return this;
    },

    get schema() {
      return _.cloneDeep(state.schema);
    },

    setSchema(val) {
      modified = true;

      state.schema = _.cloneDeep(val);
      return this;
    },

    // get a particuar path inside the schema
    get(path) {
      return _.get(state.schema, path);
    },

    // set a particuar path inside the schema
    set(path, val) {
      modified = true;

      const value = _.defaultTo(val, _.get(state.schema, path));
      _.set(state.schema, path, value);

      return this;
    },

    // delete a particuar path inside the schema
    unset(path) {
      modified = true;

      _.unset(state.schema, path);

      return this;
    },

    delete() {
      deleted = true;
      return this;
    },

    getAttribute(key) {
      return this.get(['attributes', key]);
    },

    setAttribute(key, attribute) {
      return this.set(['attributes', key], attribute);
    },

    deleteAttribute(key) {
      return this.unset(['attributes', key]);
    },

    setAttributes(newAttributes) {
      // delete old configurable attributes
      for (let key in this.schema.attributes) {
        if (isConfigurable(this.schema.attributes[key])) {
          this.deleteAttribute(key);
        }
      }

      // set new Attributes
      for (let key in newAttributes) {
        this.setAttribute(key, newAttributes[key]);
      }

      return this;
    },

    removeContentType(uid) {
      const { attributes } = state.schema;

      Object.keys(attributes).forEach(key => {
        const attribute = attributes[key];

        if (attribute.target === uid) {
          this.deleteAttribute(key);
        }
      });

      return this;
    },

    // utils
    removeComponent(uid) {
      const { attributes } = state.schema;

      Object.keys(attributes).forEach(key => {
        const attr = attributes[key];

        if (attr.type === 'component' && attr.component === uid) {
          this.deleteAttribute(key);
        }

        if (
          attr.type === 'dynamiczone' &&
          Array.isArray(attr.components) &&
          attr.components.includes(uid)
        ) {
          const updatedComponentList = attributes[key].components.filter(val => val !== uid);
          this.set(['attributes', key, 'components'], updatedComponentList);
        }
      });

      return this;
    },

    updateComponent(uid, newUID) {
      const { attributes } = state.schema;

      Object.keys(attributes).forEach(key => {
        const attr = attributes[key];

        if (attr.type === 'component' && attr.component === uid) {
          this.set(['attributes', key, 'component'], newUID);
        }

        if (
          attr.type === 'dynamiczone' &&
          Array.isArray(attr.components) &&
          attr.components.includes(uid)
        ) {
          const updatedComponentList = attr.components.map(val => (val === uid ? newUID : val));

          this.set(['attributes', key, 'components'], updatedComponentList);
        }
      });

      return this;
    },

    // save the schema to disk
    async flush() {
      if (!this.writable) {
        return;
      }

      const initialPath = path.join(initialState.dir, initialState.filename);
      const filePath = path.join(state.dir, state.filename);

      if (deleted === true) {
        await fse.remove(initialPath);

        const list = await fse.readdir(initialState.dir);
        if (list.length === 0) {
          await fse.remove(initialState.dir);
        }

        return;
      }

      if (modified === true) {
        await fse.ensureFile(filePath);

        await fse.writeJSON(
          filePath,
          {
            kind: state.schema.kind,
            collectionName: state.schema.collectionName,
            info: state.schema.info,
            options: state.schema.options,
            pluginOptions: state.schema.pluginOptions,
            attributes: state.schema.attributes,
          },
          { spaces: 2 }
        );

        // remove from oldPath
        if (initialPath !== filePath) {
          await fse.remove(initialPath);

          const list = await fse.readdir(initialState.dir);
          if (list.length === 0) {
            await fse.remove(initialState.dir);
          }
        }

        return;
      }

      return Promise.resolve();
    },

    // reset the schema to its initial value
    async rollback() {
      if (!this.writable) {
        return;
      }

      const initialPath = path.join(initialState.dir, initialState.filename);
      const filePath = path.join(state.dir, state.filename);

      // it was a creation so it needs to be deleted
      if (!initialState.uid) {
        await fse.remove(filePath);

        const list = await fse.readdir(state.dir);
        if (list.length === 0) {
          await fse.remove(state.dir);
        }
        return;
      }

      if (modified === true || deleted === true) {
        await fse.ensureFile(initialPath);
        await fse.writeJSON(initialPath, initialState.schema, { spaces: 2 });

        // remove
        if (initialPath !== filePath) {
          await fse.remove(filePath);

          const list = await fse.readdir(state.dir);
          if (list.length === 0) {
            await fse.remove(state.dir);
          }
        }
      }

      return Promise.resolve();
    },
  };
};
