/**
 *
 * Admin
 *
 */

import React, { createRef } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { bindActionCreators, compose } from 'redux';
import { Switch, Route } from 'react-router-dom';
import { injectIntl } from 'react-intl';
import { isEmpty } from 'lodash';
// Components from strapi-helper-plugin
import {
  difference,
  GlobalContextProvider,
  LoadingIndicatorPage,
  OverlayBlocker,
  UserProvider,
  CheckPagePermissions,
  request,
} from 'strapi-helper-plugin';
import { SETTINGS_BASE_URL, SHOW_TUTORIALS, STRAPI_UPDATE_NOTIF } from '../../config';

import adminPermissions from '../../permissions';
import Header from '../../components/Header/index';
import NavTopRightWrapper from '../../components/NavTopRightWrapper';
import LeftMenu from '../LeftMenu';
import InstalledPluginsPage from '../InstalledPluginsPage';
import LocaleToggle from '../LocaleToggle';
import HomePage from '../HomePage';
import MarketplacePage from '../MarketplacePage';
import NotFoundPage from '../NotFoundPage';
import OnboardingVideos from '../Onboarding';
import SettingsPage from '../SettingsPage';
import PluginDispatcher from '../PluginDispatcher';
import ProfilePage from '../ProfilePage';
import Logout from './Logout';
import {
  disableGlobalOverlayBlocker,
  enableGlobalOverlayBlocker,
  getInfosDataSucceeded,
  updatePlugin,
} from '../App/actions';
import makeSelecApp from '../App/selectors';
import {
  getStrapiLatestReleaseSucceeded,
  getUserPermissions,
  getUserPermissionsError,
  getUserPermissionsSucceeded,
  setAppError,
} from './actions';
import makeSelectAdmin from './selectors';
import Wrapper from './Wrapper';
import Content from './Content';
import itly from '../../itly';

export class Admin extends React.Component {
  // eslint-disable-line react/prefer-stateless-function

  // Ref to access the menu API
  menuRef = createRef();

  helpers = {
    updatePlugin: this.props.updatePlugin,
  };

  componentDidMount() {
    this.emitEvent('didAccessAuthenticatedAdministration');
    this.initApp();
  }

  shouldComponentUpdate(prevProps) {
    return !isEmpty(difference(prevProps, this.props));
  }

  /* istanbul ignore next */
  componentDidCatch(error, info) {
    /* eslint-disable */
    console.log('An error has occured');
    console.log('--------------------');
    console.log(error);
    console.log('Here is some infos');
    console.log(info);
    /* eslint-enable */

    // Display the error log component which is not designed yet
    this.props.setAppError();
  }

  emitEvent = async (event, properties) => {
    const {
      global: { uuid },
    } = this.props;

    if (uuid) {
      try {
        await axios.post('https://analytics.strapi.io/track', {
          event,
          // PROJECT_TYPE is an env variable defined in the webpack config
          // eslint-disable-next-line no-undef
          properties: { ...properties, projectType: PROJECT_TYPE },
          uuid,
        });
      } catch (err) {
        // Silent
      }
    }
  };

  fetchAppInfo = async () => {
    try {
      const { data } = await request('/admin/information', { method: 'GET' });

      this.props.getInfosDataSucceeded(data);
    } catch (err) {
      console.error(err);
      strapi.notification.error('notification.error');
    }
  };

  fetchStrapiLatestRelease = async () => {
    const {
      global: { strapiVersion },
      getStrapiLatestReleaseSucceeded,
    } = this.props;

    if (!STRAPI_UPDATE_NOTIF) {
      return;
    }

    try {
      const {
        data: { tag_name },
      } = await axios.get('https://api.github.com/repos/strapi/strapi/releases/latest');

      getStrapiLatestReleaseSucceeded(tag_name);

      const showUpdateNotif = !JSON.parse(localStorage.getItem('STRAPI_UPDATE_NOTIF'));

      if (!showUpdateNotif) {
        return;
      }

      if (`v${strapiVersion}` !== tag_name) {
        strapi.notification.toggle({
          type: 'info',
          message: { id: 'notification.version.update.message' },
          link: {
            url: `https://github.com/strapi/strapi/releases/tag/${tag_name}`,
            label: {
              id: 'notification.version.update.link',
            },
          },
          blockTransition: true,
          onClose: () => localStorage.setItem('STRAPI_UPDATE_NOTIF', true),
        });
      }
    } catch (err) {
      // Silent
    }
  };

  fetchUserPermissions = async (resetState = false) => {
    const { getUserPermissions, getUserPermissionsError, getUserPermissionsSucceeded } = this.props;

    if (resetState) {
      // Show a loader
      getUserPermissions();
    }

    try {
      const { data } = await request('/admin/users/me/permissions', { method: 'GET' });

      getUserPermissionsSucceeded(data);
    } catch (err) {
      console.error(err);
      getUserPermissionsError(err);
    }
  };

  hasApluginNotReady = props => {
    const {
      global: { plugins },
    } = props;

    return !Object.keys(plugins).every(plugin => plugins[plugin].isReady === true);
  };

  initApp = async () => {
    await this.fetchAppInfo();
    await this.fetchStrapiLatestRelease();
    await this.fetchUserPermissions(true);
  };

  /**
   * Display the app loader until the app is ready
   * @returns {Boolean}
   */
  showLoader = () => {
    return this.hasApluginNotReady(this.props);
  };

  renderInitializers = () => {
    const {
      global: { plugins },
    } = this.props;

    return Object.keys(plugins).reduce((acc, current) => {
      const InitializerComponent = plugins[current].initializer;

      if (InitializerComponent) {
        const key = plugins[current].id;

        acc.push(<InitializerComponent key={key} {...this.props} {...this.helpers} />);
      }

      return acc;
    }, []);
  };

  renderPluginDispatcher = props => {
    // NOTE: Send the needed props instead of everything...

    return <PluginDispatcher {...this.props} {...props} {...this.helpers} />;
  };

  renderRoute = (props, Component) => <Component {...this.props} {...props} />;

  render() {
    const {
      admin: { isLoading, latestStrapiReleaseTag, userPermissions },
      global: {
        autoReload,
        blockApp,
        currentEnvironment,
        overlayBlockerData,
        plugins,
        showGlobalAppBlocker,
        strapiVersion,
      },
      disableGlobalOverlayBlocker,
      enableGlobalOverlayBlocker,
      intl: { formatMessage, locale },
      updatePlugin,
    } = this.props;

    // We need the admin data in order to make the initializers work
    if (this.showLoader()) {
      return (
        <>
          {this.renderInitializers()}
          <LoadingIndicatorPage />
        </>
      );
    }

    // Show a loader while permissions are being fetched
    if (isLoading) {
      return <LoadingIndicatorPage />;
    }

    return (
      <GlobalContextProvider
        autoReload={autoReload}
        emitEvent={this.emitEvent}
        itly={itly}
        currentEnvironment={currentEnvironment}
        currentLocale={locale}
        disableGlobalOverlayBlocker={disableGlobalOverlayBlocker}
        enableGlobalOverlayBlocker={enableGlobalOverlayBlocker}
        fetchUserPermissions={this.fetchUserPermissions}
        formatMessage={formatMessage}
        latestStrapiReleaseTag={latestStrapiReleaseTag}
        menu={this.menuRef.current}
        plugins={plugins}
        settingsBaseURL={SETTINGS_BASE_URL || '/settings'}
        strapiVersion={strapiVersion}
        updatePlugin={updatePlugin}
      >
        <UserProvider value={userPermissions}>
          <Wrapper>
            <LeftMenu
              latestStrapiReleaseTag={latestStrapiReleaseTag}
              version={strapiVersion}
              plugins={plugins}
              ref={this.menuRef}
            />
            <NavTopRightWrapper>
              {/* Injection zone not ready yet */}
              <Logout />
              <LocaleToggle isLogged />
            </NavTopRightWrapper>
            <div className="adminPageRightWrapper">
              <Header />
              <Content>
                <Switch>
                  <Route path="/" render={props => this.renderRoute(props, HomePage)} exact />
                  <Route path="/me" component={ProfilePage} />
                  <Route path="/plugins/:pluginId" render={this.renderPluginDispatcher} />
                  <Route path="/list-plugins" exact>
                    <CheckPagePermissions permissions={adminPermissions.marketplace.main}>
                      <InstalledPluginsPage />
                    </CheckPagePermissions>
                  </Route>
                  <Route path="/marketplace">
                    <CheckPagePermissions permissions={adminPermissions.marketplace.main}>
                      <MarketplacePage />
                    </CheckPagePermissions>
                  </Route>
                  <Route
                    path={`${SETTINGS_BASE_URL || '/settings'}/:settingId`}
                    component={SettingsPage}
                  />
                  <Route path={SETTINGS_BASE_URL || '/settings'} component={SettingsPage} exact />
                  <Route key="7" path="" component={NotFoundPage} />
                  <Route key="8" path="/404" component={NotFoundPage} />
                </Switch>
              </Content>
            </div>
            <OverlayBlocker
              key="overlayBlocker"
              isOpen={blockApp && showGlobalAppBlocker}
              {...overlayBlockerData}
            />
            {SHOW_TUTORIALS && <OnboardingVideos />}
          </Wrapper>
        </UserProvider>
      </GlobalContextProvider>
    );
  }
}

Admin.defaultProps = {
  intl: {
    formatMessage: () => {},
    locale: 'en',
  },
};

Admin.propTypes = {
  admin: PropTypes.shape({
    appError: PropTypes.bool,
    isLoading: PropTypes.bool,
    latestStrapiReleaseTag: PropTypes.string.isRequired,
    userPermissions: PropTypes.array,
  }).isRequired,
  disableGlobalOverlayBlocker: PropTypes.func.isRequired,
  enableGlobalOverlayBlocker: PropTypes.func.isRequired,
  getInfosDataSucceeded: PropTypes.func.isRequired,
  getStrapiLatestReleaseSucceeded: PropTypes.func.isRequired,
  getUserPermissions: PropTypes.func.isRequired,
  getUserPermissionsError: PropTypes.func.isRequired,
  getUserPermissionsSucceeded: PropTypes.func.isRequired,
  global: PropTypes.shape({
    autoReload: PropTypes.bool,
    blockApp: PropTypes.bool,
    currentEnvironment: PropTypes.string,
    overlayBlockerData: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
    plugins: PropTypes.object,
    showGlobalAppBlocker: PropTypes.bool,
    strapiVersion: PropTypes.string,
    uuid: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  }).isRequired,
  intl: PropTypes.shape({
    formatMessage: PropTypes.func,
    locale: PropTypes.string,
  }),
  location: PropTypes.object.isRequired,
  setAppError: PropTypes.func.isRequired,
  updatePlugin: PropTypes.func.isRequired,
};

const mapStateToProps = createStructuredSelector({
  admin: makeSelectAdmin(),
  global: makeSelecApp(),
});

export function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      disableGlobalOverlayBlocker,
      enableGlobalOverlayBlocker,
      getInfosDataSucceeded,
      getStrapiLatestReleaseSucceeded,
      getUserPermissions,
      getUserPermissionsError,
      getUserPermissionsSucceeded,
      setAppError,
      updatePlugin,
    },
    dispatch
  );
}

const withConnect = connect(mapStateToProps, mapDispatchToProps);

export default compose(injectIntl, withConnect)(Admin);
