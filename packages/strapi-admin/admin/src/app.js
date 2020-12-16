/**
 *
 * app.js
 *
 * Entry point of the application
 */

// NOTE TO PLUGINS DEVELOPERS:
// If you modify this file by adding new options to a plugin entry point
// Here's the file: strapi/docs/3.0.0-beta.x/plugin-development/frontend-field-api.md
// Here's the file: strapi/docs/3.0.0-beta.x/guides/registering-a-field-in-admin.md
// Also the strapi-generate-plugins/files/admin/src/index.js needs to be updated
// IF THE DOC IS NOT UPDATED THE PULL REQUEST WILL NOT BE MERGED

/* eslint-disable */

import '@babel/polyfill';
import 'sanitize.css/sanitize.css';

// Third party css library needed
import 'bootstrap/dist/css/bootstrap.css';
import 'font-awesome/css/font-awesome.min.css';
import '@fortawesome/fontawesome-free/css/all.css';
import '@fortawesome/fontawesome-free/js/all.min.js';

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
// Strapi provider with the internal APIs
import { StrapiProvider } from 'strapi-helper-plugin';
import { merge } from 'lodash';
import Fonts from './components/Fonts';
import { freezeApp, pluginLoaded, unfreezeApp, updatePlugin } from './containers/App/actions';
import { showNotification } from './containers/NotificationProvider/actions';
import { showNotification as showNewNotification } from './containers/NewNotification/actions';

import basename from './utils/basename';
import getInjectors from './utils/reducerInjectors';
import injectReducer from './utils/injectReducer';
import injectSaga from './utils/injectSaga';
import Strapi from './utils/Strapi';

// Import root component
import App from './containers/App';
// Import Language provider
import LanguageProvider from './containers/LanguageProvider';

import configureStore from './configureStore';
import { SETTINGS_BASE_URL } from './config';

// Import i18n messages
import { translationMessages, languages } from './i18n';

// Create redux store with history
import history from './utils/history';

import plugins from './plugins';

import itly from './itly';
import TelemetryPlugin from './telemetry-plugin';

const strapi = Strapi();

const initialState = {};
const store = configureStore(initialState, history);
const { dispatch } = store;
const MOUNT_NODE = document.getElementById('app') || document.createElement('div');

itly.load({
  context: {
    projectType: PROJECT_TYPE,
  },
  plugins: [new TelemetryPlugin(store)],
});

Object.keys(plugins).forEach(current => {
  const registerPlugin = plugin => {
    return plugin;
  };
  const currentPluginFn = plugins[current];

  // By updating this by adding required methods
  // to load a plugin you need to update this file
  // strapi-generate-plugins/files/admin/src/index.js needs to be updated
  const plugin = currentPluginFn({
    registerComponent: strapi.componentApi.registerComponent,
    registerField: strapi.fieldApi.registerField,
    registerPlugin,
    settingsBaseURL: SETTINGS_BASE_URL || '/settings',
  });

  const pluginTradsPrefixed = languages.reduce((acc, lang) => {
    const currentLocale = plugin.trads[lang];

    if (currentLocale) {
      const localeprefixedWithPluginId = Object.keys(currentLocale).reduce((acc2, current) => {
        acc2[`${plugin.id}.${current}`] = currentLocale[current];

        return acc2;
      }, {});

      acc[lang] = localeprefixedWithPluginId;
    }

    return acc;
  }, {});

  // Inject plugins reducers
  const pluginReducers = plugin.reducers || {};

  Object.keys(pluginReducers).forEach(reducerName => {
    getInjectors(store).injectReducer(reducerName, pluginReducers[reducerName]);
  });

  try {
    merge(translationMessages, pluginTradsPrefixed);
    dispatch(pluginLoaded(plugin));
  } catch (err) {
    console.log({ err });
  }
});

// TODO
const remoteURL = (() => {
  // Relative URL (ex: /dashboard)
  if (REMOTE_URL[0] === '/') {
    return (window.location.origin + REMOTE_URL).replace(/\/$/, '');
  }

  return REMOTE_URL.replace(/\/$/, '');
})();

const displayNotification = (message, status) => {
  console.warn(
    // Validate the text
    'Deprecated: Will be deleted.\nPlease use strapi.notification.toggle(config).\nDocs : https://strapi.io/documentation/v3.x/plugin-development/frontend-development.html#strapi-notification'
  );
  dispatch(showNotification(message, status));
};
const displayNewNotification = config => {
  dispatch(showNewNotification(config));
};
const lockApp = data => {
  dispatch(freezeApp(data));
};
const unlockApp = () => {
  dispatch(unfreezeApp());
};

const lockAppWithOverlay = () => {
  const overlayblockerParams = {
    children: <div />,
    noGradient: true,
  };

  lockApp(overlayblockerParams);
};

window.strapi = Object.assign(window.strapi || {}, {
  node: MODE || 'host',
  env: NODE_ENV,
  remoteURL,
  backendURL: BACKEND_URL === '/' ? window.location.origin : BACKEND_URL,
  notification: {
    // New notification api
    toggle: config => {
      displayNewNotification(config);
    },
    success: message => {
      displayNotification(message, 'success');
    },
    warning: message => {
      displayNotification(message, 'warning');
    },
    error: message => {
      displayNotification(message, 'error');
    },
    info: message => {
      displayNotification(message, 'info');
    },
  },
  refresh: pluginId => ({
    translationMessages: translationMessagesUpdated => {
      render(merge({}, translationMessages, translationMessagesUpdated));
    },
    leftMenuSections: leftMenuSectionsUpdated => {
      store.dispatch(updatePlugin(pluginId, 'leftMenuSections', leftMenuSectionsUpdated));
    },
  }),
  router: history,
  languages,
  currentLanguage:
    window.localStorage.getItem('strapi-admin-language') ||
    window.navigator.language ||
    window.navigator.userLanguage ||
    'en',
  lockApp,
  lockAppWithOverlay,
  unlockApp,
  injectReducer,
  injectSaga,
  store,
});

const render = messages => {
  ReactDOM.render(
    <Provider store={store}>
      <StrapiProvider strapi={strapi}>
        <Fonts />
        <LanguageProvider messages={messages}>
          <BrowserRouter basename={basename}>
            <App store={store} />
          </BrowserRouter>
        </LanguageProvider>
      </StrapiProvider>
    </Provider>,
    MOUNT_NODE
  );
};

if (module.hot) {
  module.hot.accept(['./i18n', './containers/App'], () => {
    ReactDOM.unmountComponentAtNode(MOUNT_NODE);

    render(translationMessages);
  });
}

if (NODE_ENV !== 'test') {
  render(translationMessages);
}

// @Pierre Burgy exporting dispatch for the notifications...
export { dispatch };

// TODO remove this for the new Cypress tests
if (window.Cypress) {
  window.__store__ = Object.assign(window.__store__ || {}, { store });
}
