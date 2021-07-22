import React from 'react';
import { Switch, Route, useRouteMatch, Redirect, useLocation } from 'react-router-dom';
import { CheckPagePermissions, LoadingIndicatorPage, NotFound } from '@strapi/helper-plugin';
import permissions from '../../../permissions';
import DragLayer from '../../components/DragLayer';
import ModelsContext from '../../contexts/ModelsContext';
import CollectionTypeRecursivePath from '../CollectionTypeRecursivePath';
import ComponentSettingsView from '../ComponentSetttingsView';
import NoContentType from '../NoContentType';
import SingleTypeRecursivePath from '../SingleTypeRecursivePath';
import LeftMenu from './LeftMenu';
import useModels from './useModels';

const cmPermissions = permissions.contentManager;

const App = () => {
  const contentTypeMatch = useRouteMatch(`/content-manager/:kind/:uid`);
  const { status, collectionTypeLinks, singleTypeLinks, models, refetchData } = useModels();
  const authorisedModels = [...collectionTypeLinks, ...singleTypeLinks];
  const { pathname } = useLocation();

  if (status === 'loading') {
    return <LoadingIndicatorPage />;
  }

  // Redirect the user to the 403 page
  // FIXME when changing the routing
  if (authorisedModels.length === 0 && models.length > 0 && pathname !== '/content-manager/403') {
    return <Redirect to="/content-manager/403" />;
  }

  // Redirect the user to the create content type page
  if (models.length === 0 && pathname !== '/content-manager/no-content-types') {
    return <Redirect to="/content-manager/no-content-types" />;
  }

  if (!contentTypeMatch && authorisedModels.length > 0) {
    return (
      <Redirect
        to={`${authorisedModels[0].to}${
          authorisedModels[0].search ? `?${authorisedModels[0].search}` : ''
        }`}
      />
    );
  }

  return (
    <>
      <DragLayer />
      <ModelsContext.Provider value={{ refetchData }}>
        <div className="container-fluid">
          <div className="row">
            <LeftMenu />
            <div className="col-md-9" style={{ padding: 0 }}>
              <Switch>
                <Route path="/content-manager/components/:uid/configurations/edit">
                  <CheckPagePermissions permissions={cmPermissions.componentsConfigurations}>
                    <ComponentSettingsView />
                  </CheckPagePermissions>
                </Route>
                <Route
                  path="/content-manager/collectionType/:slug"
                  component={CollectionTypeRecursivePath}
                />
                <Route
                  path="/content-manager/singleType/:slug"
                  component={SingleTypeRecursivePath}
                />

                {/* These pages must be defined */}
                <Route
                  path="/content-manager/403"
                  render={() => <div>TBD No rights to see the content types</div>}
                />
                <Route path="/content-manager/no-content-types">
                  <NoContentType />
                </Route>
                <Route path="" component={NotFound} />
              </Switch>
            </div>
          </div>
        </div>
      </ModelsContext.Provider>
    </>
  );
};

export default App;
