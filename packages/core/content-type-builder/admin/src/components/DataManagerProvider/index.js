import React, { memo, useEffect, useMemo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { get, groupBy, set, size } from 'lodash';
import {
  request,
  LoadingIndicatorPage,
  useTracking,
  PopUpWarning,
  useNotification,
  useStrapiApp,
  useAutoReloadOverlayBlocker,
  useAppInfos,
  useRBACProvider,
} from '@strapi/helper-plugin';
import { useIntl } from 'react-intl';
import { useHistory, useLocation, useRouteMatch, Redirect } from 'react-router-dom';
import { connect, useDispatch } from 'react-redux';
import { compose } from 'redux';
import DataManagerContext from '../../contexts/DataManagerContext';
import getTrad from '../../utils/getTrad';
import makeUnique from '../../utils/makeUnique';
import pluginId from '../../pluginId';
import FormModal from '../FormModal';
import createDataObject from './utils/createDataObject';
import createModifiedDataSchema from './utils/createModifiedDataSchema';
import retrieveSpecificInfoFromComponents from './utils/retrieveSpecificInfoFromComponents';
import retrieveComponentsFromSchema from './utils/retrieveComponentsFromSchema';
import retrieveNestedComponents from './utils/retrieveNestedComponents';
import { retrieveComponentsThatHaveComponents } from './utils/retrieveComponentsThatHaveComponents';
import {
  getComponentsToPost,
  formatMainDataType,
  getCreatedAndModifiedComponents,
  sortContentType,
} from './utils/cleanData';

import {
  ADD_ATTRIBUTE,
  ADD_CREATED_COMPONENT_TO_DYNAMIC_ZONE,
  CANCEL_CHANGES,
  CHANGE_DYNAMIC_ZONE_COMPONENTS,
  CREATE_SCHEMA,
  CREATE_COMPONENT_SCHEMA,
  DELETE_NOT_SAVED_TYPE,
  EDIT_ATTRIBUTE,
  GET_DATA_SUCCEEDED,
  RELOAD_PLUGIN,
  REMOVE_FIELD_FROM_DISPLAYED_COMPONENT,
  REMOVE_COMPONENT_FROM_DYNAMIC_ZONE,
  REMOVE_FIELD,
  SET_MODIFIED_DATA,
  UPDATE_SCHEMA,
} from './constants';
import makeSelectDataManagerProvider from './selectors';
import formatSchemas from './utils/formatSchemas';

const DataManagerProvider = ({
  allIcons,
  children,
  components,
  contentTypes,
  isLoading,
  isLoadingForDataToBeSet,
  initialData,
  modifiedData,
  reservedNames,
}) => {
  const dispatch = useDispatch();
  const toggleNotification = useNotification();
  const { lockAppWithAutoreload, unlockAppWithAutoreload } = useAutoReloadOverlayBlocker();

  const { getPlugin } = useStrapiApp();

  const { apis } = getPlugin(pluginId);
  const [infoModals, toggleInfoModal] = useState({ cancel: false });
  const { autoReload } = useAppInfos();
  const { formatMessage } = useIntl();
  const { trackUsage } = useTracking();
  const { refetchPermissions } = useRBACProvider();

  const { pathname } = useLocation();
  const { push } = useHistory();
  const contentTypeMatch = useRouteMatch(`/plugins/${pluginId}/content-types/:uid`);
  const componentMatch = useRouteMatch(
    `/plugins/${pluginId}/component-categories/:categoryUid/:componentUid`
  );

  const formatMessageRef = useRef();
  formatMessageRef.current = formatMessage;
  const isInDevelopmentMode = autoReload;

  const isInContentTypeView = contentTypeMatch !== null;
  const firstKeyToMainSchema = isInContentTypeView ? 'contentType' : 'component';
  const currentUid = isInContentTypeView
    ? get(contentTypeMatch, 'params.uid', null)
    : get(componentMatch, 'params.componentUid', null);
  const abortController = new AbortController();
  const { signal } = abortController;
  const getDataRef = useRef();
  const endPoint = isInContentTypeView ? 'content-types' : 'components';

  getDataRef.current = async () => {
    try {
      const [
        { data: componentsArray },
        { data: contentTypesArray },
        reservedNames,
      ] = await Promise.all(
        ['components', 'content-types', 'reserved-names'].map(endPoint => {
          return request(`/${pluginId}/${endPoint}`, {
            method: 'GET',
            signal,
          });
        })
      );

      const components = createDataObject(componentsArray);
      const formattedComponents = formatSchemas(components);
      const contentTypes = createDataObject(contentTypesArray);
      const formattedContentTypes = formatSchemas(contentTypes);

      dispatch({
        type: GET_DATA_SUCCEEDED,
        components: formattedComponents,
        contentTypes: formattedContentTypes,
        reservedNames,
      });
    } catch (err) {
      console.error({ err });
      toggleNotification({
        type: 'warning',
        message: { id: 'notification.error' },
      });
    }
  };

  useEffect(() => {
    getDataRef.current();
  }, []);

  useEffect(() => {
    // We need to set the modifiedData after the data has been retrieved
    // and also on pathname change
    if (!isLoading && currentUid) {
      setModifiedData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, pathname, currentUid]);

  useEffect(() => {
    if (!autoReload) {
      toggleNotification({
        type: 'info',
        message: { id: getTrad('notification.info.autoreaload-disable') },
      });
    }
  }, [autoReload, toggleNotification]);

  const didModifiedComponents =
    getCreatedAndModifiedComponents(modifiedData.components || {}, components).length > 0;

  const addAttribute = (
    attributeToSet,
    forTarget,
    targetUid,
    isEditing = false,
    initialAttribute,
    shouldAddComponentToData = false
  ) => {
    const actionType = isEditing ? EDIT_ATTRIBUTE : ADD_ATTRIBUTE;

    dispatch({
      type: actionType,
      attributeToSet,
      forTarget,
      targetUid,
      initialAttribute,
      shouldAddComponentToData,
    });
  };

  const addCreatedComponentToDynamicZone = (dynamicZoneTarget, componentsToAdd) => {
    dispatch({
      type: ADD_CREATED_COMPONENT_TO_DYNAMIC_ZONE,
      dynamicZoneTarget,
      componentsToAdd,
    });
  };

  const cancelChanges = () => {
    toggleModalCancel();
    dispatch({ type: CANCEL_CHANGES });
  };

  const createSchema = (
    data,
    schemaType,
    uid,
    componentCategory,
    shouldAddComponentToData = false
  ) => {
    const type = schemaType === 'contentType' ? CREATE_SCHEMA : CREATE_COMPONENT_SCHEMA;

    dispatch({
      type,
      data,
      componentCategory,
      schemaType,
      uid,
      shouldAddComponentToData,
    });
  };

  const changeDynamicZoneComponents = (dynamicZoneTarget, newComponents) => {
    dispatch({
      type: CHANGE_DYNAMIC_ZONE_COMPONENTS,
      dynamicZoneTarget,
      newComponents,
    });
  };

  const removeAttribute = (mainDataKey, attributeToRemoveName, componentUid = '') => {
    const type =
      mainDataKey === 'components' ? REMOVE_FIELD_FROM_DISPLAYED_COMPONENT : REMOVE_FIELD;

    if (mainDataKey === 'contentType') {
      trackUsage('willDeleteFieldOfContentType');
    }

    dispatch({
      type,
      mainDataKey,
      attributeToRemoveName,
      componentUid,
    });
  };

  const deleteCategory = async categoryUid => {
    try {
      const requestURL = `/${pluginId}/component-categories/${categoryUid}`;
      // eslint-disable-next-line no-alert
      const userConfirm = window.confirm(
        formatMessage({
          id: getTrad('popUpWarning.bodyMessage.category.delete'),
        })
      );
      // Close the modal
      push({ search: '' });

      if (userConfirm) {
        lockAppWithAutoreload();

        await request(requestURL, { method: 'DELETE' }, true);

        await updatePermissions();

        // Reload the plugin so the cycle is new again
        dispatch({ type: RELOAD_PLUGIN });
        // Refetch all the data
        getDataRef.current();
      }
    } catch (err) {
      console.error({ err });
      toggleNotification({
        type: 'warning',
        message: { id: 'notification.error' },
      });
    } finally {
      unlockAppWithAutoreload();
    }
  };

  const deleteData = async () => {
    try {
      const requestURL = `/${pluginId}/${endPoint}/${currentUid}`;
      const isTemporary = get(modifiedData, [firstKeyToMainSchema, 'isTemporary'], false);
      // eslint-disable-next-line no-alert
      const userConfirm = window.confirm(
        formatMessage({
          id: getTrad(
            `popUpWarning.bodyMessage.${isInContentTypeView ? 'contentType' : 'component'}.delete`
          ),
        })
      );

      // Close the modal
      push({ search: '' });

      if (userConfirm) {
        if (isTemporary) {
          // Delete the not saved type
          // Here we just need to reset the components to the initial ones and also the content types
          // Doing so will trigging a url change since the type doesn't exist in either the contentTypes or the components
          // so the modified and the initial data will also be reset in the useEffect...
          dispatch({ type: DELETE_NOT_SAVED_TYPE });

          return;
        }

        lockAppWithAutoreload();

        await request(requestURL, { method: 'DELETE' }, true);

        // Reload the plugin so the cycle is new again
        dispatch({ type: RELOAD_PLUGIN });

        // Refetch the permissions
        await updatePermissions();

        // Refetch all the data
        getDataRef.current();
      }
    } catch (err) {
      console.error({ err });
      toggleNotification({
        type: 'warning',
        message: { id: 'notification.error' },
      });
    } finally {
      unlockAppWithAutoreload();
    }
  };

  const editCategory = async (categoryUid, body) => {
    try {
      const requestURL = `/${pluginId}/component-categories/${categoryUid}`;

      // Close the modal
      push({ search: '' });

      // Lock the app
      lockAppWithAutoreload();

      // Update the category
      await request(requestURL, { method: 'PUT', body }, true);

      await updatePermissions();

      // Reload the plugin so the cycle is new again
      dispatch({ type: RELOAD_PLUGIN });
      // Refetch all the data
      getDataRef.current();
    } catch (err) {
      console.error({ err });
      toggleNotification({
        type: 'warning',
        message: { id: 'notification.error' },
      });
    } finally {
      unlockAppWithAutoreload();
    }
  };

  const getAllComponentsThatHaveAComponentInTheirAttributes = () => {
    // We need to create an object with all the non modified compos
    // plus the ones that are created on the fly
    const allCompos = Object.assign({}, components, modifiedData.components);

    // Since we apply the modification of a specific component only in the modified data
    // we need to update all compos with the modifications
    if (!isInContentTypeView) {
      const currentEditedCompo = get(modifiedData, 'component', {});

      set(allCompos, get(currentEditedCompo, ['uid'], ''), currentEditedCompo);
    }

    const composWithCompos = retrieveComponentsThatHaveComponents(allCompos);

    return makeUnique(composWithCompos);
  };

  const getAllNestedComponents = () => {
    const appNestedCompo = retrieveNestedComponents(components);
    const editingDataNestedCompos = retrieveNestedComponents(modifiedData.components || {});

    return makeUnique([...editingDataNestedCompos, ...appNestedCompo]);
  };

  const removeComponentFromDynamicZone = (dzName, componentToRemoveIndex) => {
    dispatch({
      type: REMOVE_COMPONENT_FROM_DYNAMIC_ZONE,
      dzName,
      componentToRemoveIndex,
    });
  };

  const setModifiedData = () => {
    const currentSchemas = isInContentTypeView ? contentTypes : components;
    const schemaToSet = get(currentSchemas, currentUid, {
      schema: { attributes: [] },
    });

    const retrievedComponents = retrieveComponentsFromSchema(
      schemaToSet.schema.attributes,
      components
    );

    const newSchemaToSet = createModifiedDataSchema(
      schemaToSet,
      retrievedComponents,
      components,
      isInContentTypeView
    );

    const hasJustCreatedSchema =
      get(schemaToSet, 'isTemporary', false) &&
      size(get(schemaToSet, 'schema.attributes', [])) === 0;

    dispatch({
      type: SET_MODIFIED_DATA,
      schemaToSet: newSchemaToSet,
      hasJustCreatedSchema,
    });
  };

  const shouldRedirect = useMemo(() => {
    const dataSet = isInContentTypeView ? contentTypes : components;

    return !Object.keys(dataSet).includes(currentUid) && !isLoading;
  }, [components, contentTypes, currentUid, isInContentTypeView, isLoading]);

  const redirectEndpoint = useMemo(() => {
    const allowedEndpoints = Object.keys(contentTypes)
      .filter(uid => get(contentTypes, [uid, 'schema', 'visible'], true))
      .sort();

    return get(allowedEndpoints, '0', '');
  }, [contentTypes]);

  if (shouldRedirect) {
    return <Redirect to={`/plugins/${pluginId}/content-types/${redirectEndpoint}`} />;
  }

  const submitData = async additionalContentTypeData => {
    try {
      const isCreating = get(modifiedData, [firstKeyToMainSchema, 'isTemporary'], false);
      const body = {
        components: getComponentsToPost(
          modifiedData.components,
          components,
          currentUid,
          isCreating
        ),
      };

      if (isInContentTypeView) {
        const contentType = apis.forms.mutateContentTypeSchema(
          {
            ...formatMainDataType(modifiedData.contentType),
            ...additionalContentTypeData,
          },
          initialData.contentType
        );

        body.contentType = contentType;

        trackUsage('willSaveContentType');
      } else {
        body.component = formatMainDataType(modifiedData.component, true);

        trackUsage('willSaveComponent');
      }

      const method = isCreating ? 'POST' : 'PUT';

      const baseURL = `/${pluginId}/${endPoint}`;
      const requestURL = isCreating ? baseURL : `${baseURL}/${currentUid}`;

      // Lock the app
      lockAppWithAutoreload();

      await request(requestURL, { method, body }, true);

      unlockAppWithAutoreload();

      await updatePermissions();

      // Submit ct tracking success
      if (isInContentTypeView) {
        trackUsage('didSaveContentType');

        const oldName = get(body, ['contentType', 'schema', 'name'], '');
        const newName = get(initialData, ['contentType', 'schema', 'name'], '');

        if (!isCreating && oldName !== newName) {
          trackUsage('didEditNameOfContentType');
        }
      } else {
        trackUsage('didSaveComponent');
      }

      // Reload the plugin so the cycle is new again
      dispatch({ type: RELOAD_PLUGIN });
      // Refetch all the data
      getDataRef.current();
    } catch (err) {
      if (!isInContentTypeView) {
        trackUsage('didNotSaveComponent');
      }

      console.error({ err: err.response });
      toggleNotification({
        type: 'warning',
        message: { id: 'notification.error' },
      });
    } finally {
      unlockAppWithAutoreload();
    }
  };

  // Open the modal warning cancel changes
  const toggleModalCancel = () => {
    toggleInfoModal(prev => ({ ...prev, cancel: !prev.cancel }));
  };

  const updatePermissions = async () => {
    await refetchPermissions();
  };

  const updateSchema = (data, schemaType, componentUID) => {
    dispatch({
      type: UPDATE_SCHEMA,
      data,
      schemaType,
      uid: componentUID,
    });
  };

  return (
    <DataManagerContext.Provider
      value={{
        addAttribute,
        addCreatedComponentToDynamicZone,
        allComponentsCategories: retrieveSpecificInfoFromComponents(components, ['category']),
        allComponentsIconAlreadyTaken: retrieveSpecificInfoFromComponents(components, [
          'schema',
          'icon',
        ]),
        allIcons,
        changeDynamicZoneComponents,
        components,
        componentsGroupedByCategory: groupBy(components, 'category'),
        componentsThatHaveOtherComponentInTheirAttributes: getAllComponentsThatHaveAComponentInTheirAttributes(),
        contentTypes,
        createSchema,
        deleteCategory,
        deleteData,
        editCategory,
        isInDevelopmentMode,
        initialData,
        isInContentTypeView,
        modifiedData,
        nestedComponents: getAllNestedComponents(),
        removeAttribute,
        removeComponentFromDynamicZone,
        reservedNames,
        setModifiedData,
        sortedContentTypesList: sortContentType(contentTypes),
        submitData,
        toggleModalCancel,
        updateSchema,
      }}
    >
      {isLoadingForDataToBeSet ? (
        <LoadingIndicatorPage />
      ) : (
        <>
          {children}
          {isInDevelopmentMode && (
            <>
              <FormModal />
              <PopUpWarning
                isOpen={infoModals.cancel}
                toggleModal={toggleModalCancel}
                content={{
                  message: getTrad(
                    `popUpWarning.bodyMessage.cancel-modifications${
                      didModifiedComponents ? '.with-components' : ''
                    }`
                  ),
                }}
                popUpWarningType="danger"
                onConfirm={() => {
                  cancelChanges();
                }}
              />
            </>
          )}
        </>
      )}
    </DataManagerContext.Provider>
  );
};

DataManagerProvider.defaultProps = {
  components: {},
};

DataManagerProvider.propTypes = {
  allIcons: PropTypes.array.isRequired,
  children: PropTypes.node.isRequired,
  components: PropTypes.object,
  contentTypes: PropTypes.object.isRequired,
  isLoading: PropTypes.bool.isRequired,
  isLoadingForDataToBeSet: PropTypes.bool.isRequired,
  initialData: PropTypes.object.isRequired,
  modifiedData: PropTypes.object.isRequired,
  reservedNames: PropTypes.object.isRequired,
};

const mapStateToProps = makeSelectDataManagerProvider();
const withConnect = connect(mapStateToProps, null);

export default compose(withConnect)(memo(DataManagerProvider));
