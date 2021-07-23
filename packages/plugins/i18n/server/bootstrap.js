'use strict';

const { getService } = require('./utils');

module.exports = async strapi => {
  const { sendDidInitializeEvent } = getService('metrics');
  const { decorator } = getService('entity-service-decorator');
  const { initDefaultLocale } = getService('locales');
  const { sectionsBuilder, actions, engine } = getService('permissions');

  // Entity Service
  strapi.entityService.decorate(decorator);

  // Data
  await initDefaultLocale();

  // Sections Builder
  sectionsBuilder.registerLocalesPropertyHandler();

  // Actions
  await actions.registerI18nActions();
  actions.registerI18nActionsHooks();
  actions.updateActionsProperties();

  // Engine/Permissions
  engine.registerI18nPermissionsHandlers();

  // Hooks & Models

  // TODO: implement
  // registerModelsHooks();

  sendDidInitializeEvent();
};

const registerModelsHooks = () => {
  Object.values(strapi.models)
    .filter(model => getService('content-types').isLocalizedContentType(model))
    .forEach(model => {
      strapi.db.lifecycles.register({
        model: model.uid,
        async beforeCreate(data) {
          await getService('localizations').assignDefaultLocale(data);
        },
      });
    });

  strapi.db.lifecycles.register({
    model: 'plugins::i18n.locale',

    async afterCreate() {
      await getService('permissions').actions.syncSuperAdminPermissionsWithLocales();
    },

    async afterDelete() {
      await getService('permissions').actions.syncSuperAdminPermissionsWithLocales();
    },
  });
};
