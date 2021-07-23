import extendCTBAttributeInitialDataMiddleware from '../extendCTBAttributeInitialDataMiddleware';

describe('i18n | middlewares | extendCTBAttributeInitialDataMiddleware', () => {
  it('should forward the action if the type is undefined', () => {
    const middleware = extendCTBAttributeInitialDataMiddleware();
    const action = { test: true, type: undefined };
    const getState = jest.fn();

    const next = jest.fn();

    middleware({ getState })(next)(action);

    expect(next).toBeCalledWith(action);
  });

  it('should forward if the type is not correct', () => {
    const middleware = extendCTBAttributeInitialDataMiddleware();
    const action = { test: true, type: 'TEST' };
    const getState = jest.fn();

    const next = jest.fn();

    middleware({ getState })(next)(action);

    expect(next).toBeCalledWith(action);
  });

  describe('should forward when the type is ContentTypeBuilder/FormModal/SET_ATTRIBUTE_DATA_SCHEMA', () => {
    it('should forward if the forTarget is not contentType', () => {
      const middleware = extendCTBAttributeInitialDataMiddleware();
      const action = {
        forTarget: 'contentType',
        type: 'ContentTypeBuilder/FormModal/SET_ATTRIBUTE_DATA_SCHEMA',
      };
      const getState = jest.fn();

      const next = jest.fn();

      middleware({ getState })(next)(action);

      expect(next).toBeCalledWith(action);
    });

    it('should forward if the i18n is not activated is not contentType', () => {
      const middleware = extendCTBAttributeInitialDataMiddleware();
      const action = {
        forTarget: 'contentType',
        attributeType: 'text',
        type: 'ContentTypeBuilder/FormModal/SET_ATTRIBUTE_DATA_SCHEMA',
      };
      const getState = jest.fn(() => ({
        'content-type-builder_dataManagerProvider': {
          modifiedData: {
            contentType: { schema: { pluginOptions: { i18n: { localized: false } } } },
          },
        },
      }));

      const next = jest.fn();

      middleware({ getState })(next)(action);

      expect(next).toBeCalledWith(action);
    });

    it('should forward if the ctb is not mounted', () => {
      const middleware = extendCTBAttributeInitialDataMiddleware();
      const action = {
        forTarget: 'contentType',
        attributeType: 'text',
        type: 'ContentTypeBuilder/FormModal/SET_ATTRIBUTE_DATA_SCHEMA',
      };
      const getState = jest.fn(() => ({
        'content-type-builder_dataManagerProvider': undefined,
      }));

      const next = jest.fn();

      middleware({ getState })(next)(action);

      expect(next).toBeCalledWith(action);
    });
  });

  it('should add the action.pluginOptions if the type is correct and i18n is activated', () => {
    const middleware = extendCTBAttributeInitialDataMiddleware();
    const action = {
      forTarget: 'contentType',
      attributeType: 'text',
      type: 'ContentTypeBuilder/FormModal/SET_ATTRIBUTE_DATA_SCHEMA',
    };
    const getState = jest.fn(() => ({
      'content-type-builder_dataManagerProvider': {
        // i18n is activated
        modifiedData: {
          contentType: { schema: { pluginOptions: { i18n: { localized: true } } } },
        },
      },
    }));

    const next = jest.fn();

    middleware({ getState })(next)(action);

    expect(next).toBeCalledWith({
      ...action,
      options: { pluginOptions: { i18n: { localized: true } } },
    });
  });

  it('should modify the options.pluginOptions when it exists', () => {
    const middleware = extendCTBAttributeInitialDataMiddleware();
    const action = {
      forTarget: 'contentType',
      type: 'ContentTypeBuilder/FormModal/RESET_PROPS_AND_SET_FORM_FOR_ADDING_AN_EXISTING_COMPO',
      options: { pluginOptions: { pluginTest: { ok: true } } },
    };
    const getState = jest.fn(() => ({
      'content-type-builder_dataManagerProvider': {
        // i18n is activated
        modifiedData: {
          contentType: { schema: { pluginOptions: { i18n: { localized: true } } } },
        },
      },
    }));

    const next = jest.fn();

    middleware({ getState })(next)(action);

    expect(next).toBeCalledWith({
      ...action,
      options: { pluginOptions: { pluginTest: { ok: true }, i18n: { localized: true } } },
    });
  });
});
