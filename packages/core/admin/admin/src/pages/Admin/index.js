/**
 *
 * Admin
 *
 */

import React, { Suspense, useEffect, useMemo, lazy } from 'react';
import { Switch, Route } from 'react-router-dom';
// Components from @strapi/helper-plugin
import {
  CheckPagePermissions,
  useTracking,
  LoadingIndicatorPage,
  useStrapiApp,
} from '@strapi/helper-plugin';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import adminPermissions from '../../permissions';
import Header from '../../components/Header/index';
import NavTopRightWrapper from '../../components/NavTopRightWrapper';
import LeftMenu from '../../components/LeftMenu';
import Onboarding from '../../components/Onboarding';
import { useMenu, useReleaseNotification } from '../../hooks';
import Logout from './Logout';
import Wrapper from './Wrapper';
import Content from './Content';
import { createRoute } from '../../utils';

const CM = lazy(() =>
  import(/* webpackChunkName: "content-manager" */ '../../content-manager/pages/App')
);
const HomePage = lazy(() => import(/* webpackChunkName: "Admin_homePage" */ '../HomePage'));
const InstalledPluginsPage = lazy(() =>
  import(/* webpackChunkName: "Admin_pluginsPage" */ '../InstalledPluginsPage')
);
const MarketplacePage = lazy(() =>
  import(/* webpackChunkName: "Admin_marketplace" */ '../MarketplacePage')
);
const NotFoundPage = lazy(() => import('../NotFoundPage'));

const ProfilePage = lazy(() =>
  import(/* webpackChunkName: "Admin_profilePage" */ '../ProfilePage')
);
const SettingsPage = lazy(() =>
  import(/* webpackChunkName: "Admin_settingsPage" */ '../SettingsPage')
);

const CTB = lazy(() =>
  import(
    /* webpackChunkName: "content-type-builder" */ '@strapi/plugin-content-type-builder/admin/src/pages/App'
  )
);
const Upload = lazy(() =>
  import(/* webpackChunkName: "upload" */ '@strapi/plugin-upload/admin/src/pages/App')
);

// Simple hook easier for testing
const useTrackUsage = () => {
  const { trackUsage } = useTracking();

  useEffect(() => {
    trackUsage('didAccessAuthenticatedAdministration');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

const Admin = () => {
  // Show a notification when the current version of Strapi is not the latest one
  useReleaseNotification();
  useTrackUsage();
  const { isLoading, generalSectionLinks, pluginsSectionLinks } = useMenu();
  const { menu } = useStrapiApp();

  const routes = useMemo(() => {
    return menu
      .filter(link => link.Component)
      .map(({ to, Component, exact }) => createRoute(Component, to, exact));
  }, [menu]);

  if (isLoading) {
    return <LoadingIndicatorPage />;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Wrapper>
        <LeftMenu
          generalSectionLinks={generalSectionLinks}
          pluginsSectionLinks={pluginsSectionLinks}
        />
        <NavTopRightWrapper>
          <Logout />
        </NavTopRightWrapper>
        <div className="adminPageRightWrapper">
          <Header />
          <Content>
            <Suspense fallback={<LoadingIndicatorPage />}>
              <Switch>
                <Route path="/" component={HomePage} exact />
                <Route path="/me" component={ProfilePage} exact />

                <Route path="/content-manager" component={CM} />
                <Route path="/plugins/content-type-builder" component={CTB} />
                <Route path="/plugins/upload" component={Upload} />
                {routes}
                <Route path="/settings/:settingId" component={SettingsPage} />
                <Route path="/settings" component={SettingsPage} exact />
                <Route path="/marketplace">
                  <CheckPagePermissions permissions={adminPermissions.marketplace.main}>
                    <MarketplacePage />
                  </CheckPagePermissions>
                </Route>
                <Route path="/list-plugins" exact>
                  <CheckPagePermissions permissions={adminPermissions.marketplace.main}>
                    <InstalledPluginsPage />
                  </CheckPagePermissions>
                </Route>
                <Route path="/404" component={NotFoundPage} />
                <Route path="" component={NotFoundPage} />
              </Switch>
            </Suspense>
          </Content>
        </div>
        <Onboarding />
      </Wrapper>
    </DndProvider>
  );
};

export default Admin;
export { useTrackUsage };
