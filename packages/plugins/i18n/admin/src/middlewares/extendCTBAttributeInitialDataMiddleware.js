import get from 'lodash/get';

const extendCTBAttributeInitialDataMiddleware = () => {
  return ({ getState }) => next => action => {
    const enhanceAction = () => {
      // the block here is to catch the error when trying to access the state
      // of the ctb when the plugin is not mounted
      try {
        const store = getState();

        const hasi18nEnabled = get(
          store,
          [
            'content-type-builder_dataManagerProvider',
            'modifiedData',
            'contentType',
            'schema',
            'pluginOptions',
            'i18n',
            'localized',
          ],
          false
        );

        if (hasi18nEnabled) {
          const pluginOptions = action.options
            ? { ...action.options.pluginOptions, i18n: { localized: true } }
            : { i18n: { localized: true } };

          return next({
            ...action,
            options: {
              pluginOptions,
            },
          });
        }

        return next(action);
      } catch (err) {
        return next(action);
      }
    };

    if (
      action.type === 'ContentTypeBuilder/FormModal/SET_ATTRIBUTE_DATA_SCHEMA' &&
      action.forTarget === 'contentType' &&
      !['relation', 'component'].includes(action.attributeType) &&
      !action.isEditing
    ) {
      return enhanceAction();
    }

    if (
      (action.type ===
        'ContentTypeBuilder/FormModal/RESET_PROPS_AND_SET_FORM_FOR_ADDING_AN_EXISTING_COMPO' ||
        action.type === 'ContentTypeBuilder/FormModal/RESET_PROPS_AND_SAVE_CURRENT_DATA') &&
      action.forTarget === 'contentType'
    ) {
      return enhanceAction();
    }

    return next(action);
  };
};

export default extendCTBAttributeInitialDataMiddleware;
