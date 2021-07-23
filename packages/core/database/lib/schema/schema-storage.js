'use strict';

module.exports = db => ({
  async read() {
    /*
        NOTE:
        1- read the tables structure etc
        2- select from a specific table
      */

    if (await db.connection.schema.hasTable('strapi_database_schema')) {
      // NOTE: We could store and history of database schemas to fix / rollback etc ?
      const res = await db.connection
        .select('*')
        .from('strapi_database_schema')
        .orderBy('id', 'DESC')
        .first();

      if (!res) {
        return null;
      }

      return typeof res.schema === 'object' ? res.schema : JSON.parse(res.schema);
    }

    return null;
  },

  async update(schema) {
    await db.connection('strapi_database_schema').update({
      schema: JSON.stringify(schema),
    });
  },

  async create(schema) {
    await db.connection('strapi_database_schema').insert({
      schema: JSON.stringify(schema),
    });
  },

  async clear() {
    await db.connection('strapi_database_schema').del();
  },
});
