import React, { useCallback, useEffect, useMemo, useRef, useReducer, useState } from 'react';
import { cloneDeep, get, isEmpty, isEqual, pick, set } from 'lodash';
import PropTypes from 'prop-types';
import {
  Prompt,
  Redirect,
  useParams,
  useLocation,
  useHistory,
  useRouteMatch,
} from 'react-router-dom';
import {
  LoadingIndicatorPage,
  request,
  useGlobalContext,
  useUser,
  useUserPermissions,
  OverlayBlocker,
} from 'strapi-helper-plugin';
import EditViewDataManagerContext from '../../contexts/EditViewDataManager';
import { generatePermissionsObject, getTrad } from '../../utils';
import pluginId from '../../pluginId';
import init from './init';
import reducer, { initialState } from './reducer';
import {
  cleanData,
  createDefaultForm,
  createYupSchema,
  getFieldsActionMatchingPermissions,
  getFilesToUpload,
  getYupInnerErrors,
  removePasswordFieldsFromData,
} from './utils';

const getRequestUrl = path => `/${pluginId}/explorer/${path}`;

const EditViewDataManagerProvider = ({
  allLayoutData,
  children,
  isSingleType,
  redirectToPreviousPage,
  slug,
}) => {
  const { id } = useParams();
  const [reducerState, dispatch] = useReducer(reducer, initialState, init);
  const { state } = useLocation();
  const abortController = new AbortController();
  const { signal } = abortController;

  const { push, replace } = useHistory();
  // Here in case of a 403 response when fetching data we will either redirect to the previous page
  // Or to the homepage if there's no state in the history stack
  const from = get(state, 'from', '/');
  const {
    formErrors,
    initialData,
    isLoading,
    modifiedData,
    modifiedDZName,
    shouldCheckErrors,
  } = reducerState.toJS();
  const [isCreatingEntry, setIsCreatingEntry] = useState(id === 'create');
  const [status, setStatus] = useState('resolved');
  const currentContentTypeLayout = get(allLayoutData, ['contentType'], {});
  const hasDraftAndPublish = useMemo(() => {
    return get(currentContentTypeLayout, ['schema', 'options', 'draftAndPublish'], false);
  }, [currentContentTypeLayout]);

  const shouldNotRunValidations = useMemo(() => {
    return hasDraftAndPublish && !initialData.published_at;
  }, [hasDraftAndPublish, initialData.published_at]);
  const {
    params: { contentType },
  } = useRouteMatch('/plugins/content-manager/:contentType');
  // This is used for the readonly mode when updating an entry
  const allDynamicZoneFields = useMemo(() => {
    const attributes = get(currentContentTypeLayout, ['schema', 'attributes'], {});

    const dynamicZoneFields = Object.keys(attributes).filter(attrName => {
      return get(attributes, [attrName, 'type'], '') === 'dynamiczone';
    });

    return dynamicZoneFields;
  }, [currentContentTypeLayout]);

  const { itly, emitEvent, formatMessage } = useGlobalContext();
  const emitEventRef = useRef(emitEvent);
  const userPermissions = useUser();
  const generatedPermissions = useMemo(() => generatePermissionsObject(slug), [slug]);

  const permissionsToApply = useMemo(() => {
    const fieldsToPick = isCreatingEntry ? ['create'] : ['read', 'update'];

    return pick(generatedPermissions, fieldsToPick);
  }, [isCreatingEntry, generatedPermissions]);
  const {
    isLoading: isLoadingForPermissions,
    allowedActions: { canCreate, canRead, canUpdate },
  } = useUserPermissions(permissionsToApply);

  const {
    createActionAllowedFields,
    readActionAllowedFields,
    updateActionAllowedFields,
  } = useMemo(() => {
    return getFieldsActionMatchingPermissions(userPermissions, slug);
  }, [userPermissions, slug]);

  const shouldRedirectToHomepageWhenCreatingEntry = useMemo(() => {
    if (isLoadingForPermissions || isLoading) {
      return false;
    }

    if (!isCreatingEntry) {
      return false;
    }

    if (canCreate === false) {
      return true;
    }

    return false;
  }, [isLoadingForPermissions, isCreatingEntry, canCreate, isLoading]);

  const shouldRedirectToHomepageWhenEditingEntry = useMemo(() => {
    if (isLoadingForPermissions || isLoading) {
      return false;
    }

    if (isCreatingEntry) {
      return false;
    }

    if (canRead === false && canUpdate === false) {
      return true;
    }

    return false;
  }, [isLoadingForPermissions, isLoading, isCreatingEntry, canRead, canUpdate]);

  useEffect(() => {
    if (!isLoading) {
      checkFormErrors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldCheckErrors]);

  useEffect(() => {
    if (shouldRedirectToHomepageWhenEditingEntry) {
      strapi.notification.toggle({
        type: 'info',
        message: { id: getTrad('permissions.not-allowed.update') },
      });
    }
  }, [shouldRedirectToHomepageWhenEditingEntry]);

  useEffect(() => {
    if (shouldRedirectToHomepageWhenCreatingEntry) {
      strapi.notification.toggle({
        type: 'info',
        message: { id: getTrad('permissions.not-allowed.create') },
      });
    }
  }, [shouldRedirectToHomepageWhenCreatingEntry]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await request(getRequestUrl(`${slug}/${id || ''}`), {
          method: 'GET',
          signal,
        });

        dispatch({
          type: 'GET_DATA_SUCCEEDED',
          data: removePasswordFieldsFromData(
            data,
            allLayoutData.contentType,
            allLayoutData.components
          ),
        });
      } catch (err) {
        console.log(err);
        const resStatus = get(err, 'response.status', null);

        // The record does not exists
        // Redirect the user to the previous page
        if (id && resStatus === 404) {
          push(from);

          return;
        }

        if (id && resStatus === 403) {
          strapi.notification.toggle({
            type: 'info',
            message: { id: getTrad('permissions.not-allowed.update') },
          });

          push(from);

          return;
        }

        if (id && err.code !== 20) {
          strapi.notification.toggle({
            type: 'warning',
            message: { id: `${pluginId}.error.record.fetch` },
          });
        }

        // Create a single type
        if (!id && resStatus === 404) {
          setIsCreatingEntry(true);

          return;
        }

        // Not allowed to update or read a ST
        if (!id && resStatus === 403) {
          strapi.notification.toggle({
            type: 'info',
            message: { id: getTrad('permissions.not-allowed.update') },
          });

          push(from);
        }
      }
    };

    const componentsDataStructure = Object.keys(allLayoutData.components).reduce((acc, current) => {
      acc[current] = createDefaultForm(
        get(allLayoutData, ['components', current, 'schema', 'attributes'], {}),
        allLayoutData.components
      );

      return acc;
    }, {});

    const contentTypeDataStructure = createDefaultForm(
      currentContentTypeLayout.schema.attributes,
      allLayoutData.components
    );

    if (!isLoadingForPermissions) {
      // Force state to be cleared when navigation from one entry to another
      dispatch({ type: 'RESET_PROPS' });
      dispatch({
        type: 'SET_DEFAULT_DATA_STRUCTURES',
        componentsDataStructure,
        contentTypeDataStructure,
      });

      if (!isCreatingEntry) {
        fetchData();
      } else {
        // Will create default form
        dispatch({
          type: 'SET_DEFAULT_MODIFIED_DATA_STRUCTURE',
          contentTypeDataStructure,
        });
      }
    }

    return () => {
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, slug, isLoadingForPermissions]);

  const addComponentToDynamicZone = useCallback((keys, componentUid, shouldCheckErrors = false) => {
    emitEvent('didAddComponentToDynamicZone');
    dispatch({
      type: 'ADD_COMPONENT_TO_DYNAMIC_ZONE',
      keys: keys.split('.'),
      componentUid,
      shouldCheckErrors,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addNonRepeatableComponentToField = useCallback((keys, componentUid) => {
    dispatch({
      type: 'ADD_NON_REPEATABLE_COMPONENT_TO_FIELD',
      keys: keys.split('.'),
      componentUid,
    });
  }, []);

  const addRelation = useCallback(({ target: { name, value } }) => {
    dispatch({
      type: 'ADD_RELATION',
      keys: name.split('.'),
      value,
    });
  }, []);

  const addRepeatableComponentToField = useCallback(
    (keys, componentUid, shouldCheckErrors = false) => {
      dispatch({
        type: 'ADD_REPEATABLE_COMPONENT_TO_FIELD',
        keys: keys.split('.'),
        componentUid,
        shouldCheckErrors,
      });
    },
    []
  );

  const checkFormErrors = async (dataToSet = {}) => {
    const schema = createYupSchema(
      currentContentTypeLayout,
      {
        components: get(allLayoutData, 'components', {}),
      },
      { isCreatingEntry, isDraft: shouldNotRunValidations, isFromComponent: false }
    );
    let errors = {};
    const updatedData = cloneDeep(modifiedData);

    if (!isEmpty(updatedData)) {
      set(updatedData, dataToSet.path, dataToSet.value);
    }

    try {
      // Validate the form using yup
      await schema.validate(updatedData, { abortEarly: false });
    } catch (err) {
      errors = getYupInnerErrors(err);

      if (modifiedDZName) {
        errors = Object.keys(errors).reduce((acc, current) => {
          const dzName = current.split('.')[0];

          if (dzName !== modifiedDZName) {
            acc[current] = errors[current];
          }

          return acc;
        }, {});
      }
    }

    dispatch({
      type: 'SET_ERRORS',
      errors,
    });
  };

  const handleChange = useCallback(
    ({ target: { name, value, type } }, shouldSetInitialValue = false) => {
      let inputValue = value;

      // Empty string is not a valid date,
      // Set the date to null when it's empty
      if (type === 'date' && value === '') {
        inputValue = null;
      }

      if (type === 'password' && !value) {
        dispatch({
          type: 'REMOVE_PASSWORD_FIELD',
          keys: name.split('.'),
        });

        return;
      }

      // Allow to reset enum
      if (type === 'select-one' && value === '') {
        inputValue = null;
      }

      // Allow to reset number input
      if (type === 'number' && value === '') {
        inputValue = null;
      }

      dispatch({
        type: 'ON_CHANGE',
        keys: name.split('.'),
        value: inputValue,
        shouldSetInitialValue,
      });
    },
    []
  );

  const handleSubmit = async e => {
    e.preventDefault();
    const trackerProperty = hasDraftAndPublish ? { status: 'draft' } : {};

    // Create yup schema
    const schema = createYupSchema(
      currentContentTypeLayout,
      {
        components: get(allLayoutData, 'components', {}),
      },
      { isCreatingEntry, isDraft: shouldNotRunValidations, isFromComponent: false }
    );

    try {
      // Validate the form using yup
      await schema.validate(modifiedData, { abortEarly: false });

      // Show a loading button in the EditView/Header.js
      setStatus('submit-pending');

      // Set the loading state in the plugin header
      const filesToUpload = getFilesToUpload(modifiedData);
      // Remove keys that are not needed
      // Clean relations
      const cleanedData = cleanData(
        cloneDeep(modifiedData),
        currentContentTypeLayout,
        allLayoutData.components
      );

      const formData = new FormData();

      formData.append('data', JSON.stringify(cleanedData));

      Object.keys(filesToUpload).forEach(key => {
        const files = filesToUpload[key];

        files.forEach(file => {
          formData.append(`files.${key}`, file);
        });
      });

      // Change the request helper default headers so we can pass a FormData
      const headers = {};
      const method = isCreatingEntry ? 'POST' : 'PUT';
      let endPoint;

      // All endpoints for creation and edition are the same for both content types
      // But, the id from the URL didn't exist for the single types.
      // So, we use the id of the modified data if this one is setted.
      if (isCreatingEntry) {
        endPoint = slug;
      } else if (modifiedData) {
        endPoint = `${slug}/${modifiedData.id}`;
      } else {
        endPoint = `${slug}/${id}`;
      }

      if (!isCreatingEntry) {
        itly.willEditEntry(trackerProperty);
      }

      try {
        // Time to actually send the data
        const res = await request(
          getRequestUrl(endPoint),
          {
            method,
            headers,
            body: formData,
            signal,
          },
          false,
          false
        );

        if (isCreatingEntry) {
          itly.didCreateEntry(trackerProperty);
        } else {
          itly.didEditEntry(trackerProperty);
        }

        setStatus('resolved');

        dispatch({
          type: 'SUBMIT_SUCCESS',
        });
        strapi.notification.toggle({
          type: 'success',
          message: { id: `${pluginId}.success.record.save` },
        });

        setIsCreatingEntry(false);

        if (!isSingleType) {
          replace(`/plugins/${pluginId}/${contentType}/${slug}/${res.id}`);
        }
      } catch (err) {
        console.error({ err });
        setStatus('resolved');

        const error = get(
          err,
          ['response', 'payload', 'message', '0', 'messages', '0', 'id'],
          'SERVER ERROR'
        );

        // Handle validations errors from the API
        if (error === 'ValidationError') {
          const errors = get(err, ['response', 'payload', 'data', '0', 'errors'], {});
          const formattedErrors = Object.keys(errors).reduce((acc, current) => {
            acc[current] = { id: errors[current][0] };

            return acc;
          }, {});

          dispatch({
            type: 'SUBMIT_ERRORS',
            errors: formattedErrors,
          });
        } else {
          emitEvent(isCreatingEntry ? 'didNotCreateEntry' : 'didNotEditEntry', {
            error: err,
            ...trackerProperty,
          });
        }

        strapi.notification.toggle({
          type: 'warning',
          message: { id: `${pluginId}.error.record.fetch` },
        });
      }
    } catch (err) {
      console.error({ err });
      const errors = getYupInnerErrors(err);
      setStatus('resolved');

      dispatch({
        type: 'SUBMIT_ERRORS',
        errors,
      });
    }
  };

  const handlePublish = useCallback(async () => {
    // Create yup schema
    const schema = createYupSchema(
      currentContentTypeLayout,
      {
        components: get(allLayoutData, 'components', {}),
      },
      { isCreatingEntry, isDraft: false, isFromComponent: false }
    );

    try {
      // Validate the form using yup
      await schema.validate(modifiedData, { abortEarly: false });

      // Show a loading button in the EditView/Header.js
      setStatus('publish-pending');

      try {
        emitEventRef.current('willPublishEntry');

        // Time to actually send the data
        const data = await request(
          getRequestUrl(`${slug}/publish/${id || modifiedData.id}`),
          {
            method: 'POST',
          },
          false,
          false
        );

        emitEventRef.current('didPublishEntry');

        setStatus('resolved');

        dispatch({
          type: 'PUBLISH_SUCCESS',
          data,
        });
        strapi.notification.toggle({
          type: 'success',
          message: { id: `${pluginId}.success.record.publish` },
        });
      } catch (err) {
        // ---------- @Soupette Is this error handling still mandatory? ----------
        // The api error send response.payload.message: 'The error message'.
        // There isn't : response.payload.message[0].messages[0].id
        console.error({ err });
        setStatus('resolved');

        const error = get(
          err,
          ['response', 'payload', 'message', '0', 'messages', '0', 'id'],
          'SERVER ERROR'
        );

        if (error === 'ValidationError') {
          const errors = get(err, ['response', 'payload', 'data', '0', 'errors'], {});
          const formattedErrors = Object.keys(errors).reduce((acc, current) => {
            acc[current] = { id: errors[current][0] };

            return acc;
          }, {});

          dispatch({
            type: 'PUBLISH_ERRORS',
            errors: formattedErrors,
          });
        }

        const errorMessage = get(err, ['response', 'payload', 'message'], 'SERVER ERROR');
        strapi.notification.toggle({
          type: 'warning',
          message: errorMessage,
        });
      }
    } catch (err) {
      console.error({ err });
      const errors = getYupInnerErrors(err);
      console.log({ errors });
      setStatus('resolved');

      dispatch({
        type: 'PUBLISH_ERRORS',
        errors,
      });
    }
  }, [allLayoutData, currentContentTypeLayout, id, isCreatingEntry, modifiedData, slug]);

  const handleUnpublish = useCallback(async () => {
    try {
      setStatus('unpublish-pending');

      emitEventRef.current('willUnpublishEntry');

      const data = await request(
        getRequestUrl(`${slug}/unpublish/${id || modifiedData.id}`),
        {
          method: 'POST',
        },
        false,
        false
      );

      emitEventRef.current('didUnpublishEntry');
      setStatus('resolved');

      dispatch({
        type: 'UNPUBLISH_SUCCESS',
        data,
      });
      strapi.notification.toggle({
        type: 'success',
        message: { id: `${pluginId}.success.record.unpublish` },
      });
    } catch (err) {
      console.error({ err });
      setStatus('resolved');

      const errorMessage = get(err, ['response', 'payload', 'message'], 'SERVER ERROR');
      strapi.notification.toggle({
        type: 'warning',
        message: errorMessage,
      });
    }
  }, [id, modifiedData, slug]);

  const shouldCheckDZErrors = useCallback(
    dzName => {
      const doesDZHaveError = Object.keys(formErrors).some(key => key.split('.')[0] === dzName);
      const shouldCheckErrors = !isEmpty(formErrors) && doesDZHaveError;

      return shouldCheckErrors;
    },
    [formErrors]
  );

  const moveComponentDown = useCallback(
    (dynamicZoneName, currentIndex) => {
      emitEvent('changeComponentsOrder');
      dispatch({
        type: 'MOVE_COMPONENT_DOWN',
        dynamicZoneName,
        currentIndex,
        shouldCheckErrors: shouldCheckDZErrors(dynamicZoneName),
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shouldCheckDZErrors]
  );

  const moveComponentUp = useCallback(
    (dynamicZoneName, currentIndex) => {
      emitEvent('changeComponentsOrder');
      dispatch({
        type: 'MOVE_COMPONENT_UP',
        dynamicZoneName,
        currentIndex,
        shouldCheckErrors: shouldCheckDZErrors(dynamicZoneName),
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shouldCheckDZErrors]
  );

  const moveComponentField = useCallback((pathToComponent, dragIndex, hoverIndex) => {
    dispatch({
      type: 'MOVE_COMPONENT_FIELD',
      pathToComponent,
      dragIndex,
      hoverIndex,
    });
  }, []);

  const moveRelation = useCallback((dragIndex, overIndex, name) => {
    dispatch({
      type: 'MOVE_FIELD',
      dragIndex,
      overIndex,
      keys: name.split('.'),
    });
  }, []);

  const onRemoveRelation = useCallback(keys => {
    dispatch({
      type: 'REMOVE_RELATION',
      keys,
    });
  }, []);

  const removeComponentFromDynamicZone = useCallback((dynamicZoneName, index) => {
    emitEvent('removeComponentFromDynamicZone');

    dispatch({
      type: 'REMOVE_COMPONENT_FROM_DYNAMIC_ZONE',
      dynamicZoneName,
      index,
      shouldCheckErrors: shouldCheckDZErrors(dynamicZoneName),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const removeComponentFromField = useCallback((keys, componentUid) => {
    dispatch({
      type: 'REMOVE_COMPONENT_FROM_FIELD',
      keys: keys.split('.'),
      componentUid,
    });
  }, []);

  const removeRepeatableField = useCallback((keys, componentUid) => {
    dispatch({
      type: 'REMOVE_REPEATABLE_FIELD',
      keys: keys.split('.'),
      componentUid,
    });
  }, []);

  const deleteSuccess = () => {
    dispatch({
      type: 'DELETE_SUCCEEDED',
    });
  };

  const resetData = () => {
    dispatch({
      type: 'RESET_DATA',
    });
  };

  const clearData = useCallback(() => {
    if (isSingleType) {
      setIsCreatingEntry(true);
    }

    dispatch({
      type: 'SET_DEFAULT_MODIFIED_DATA_STRUCTURE',
      contentTypeDataStructure: {},
    });
  }, [isSingleType]);

  const triggerFormValidation = () => {
    dispatch({
      type: 'TRIGGER_FORM_VALIDATION',
    });
  };

  const overlayBlockerParams = useMemo(
    () => ({
      children: <div />,
      noGradient: true,
    }),
    []
  );

  // Redirect the user to the homepage if he is not allowed to create a document
  if (shouldRedirectToHomepageWhenCreatingEntry) {
    return <Redirect to="/" />;
  }

  // Redirect the user to the previous page if he is not allowed to read/update a document
  if (shouldRedirectToHomepageWhenEditingEntry) {
    return <Redirect to={from} />;
  }

  return (
    <EditViewDataManagerContext.Provider
      value={{
        addComponentToDynamicZone,
        addNonRepeatableComponentToField,
        addRelation,
        addRepeatableComponentToField,
        allLayoutData,
        allDynamicZoneFields,
        checkFormErrors,
        clearData,
        createActionAllowedFields,
        deleteSuccess,
        formErrors,
        hasDraftAndPublish,
        initialData,
        isCreatingEntry,
        isSingleType,
        shouldNotRunValidations,
        status,
        layout: currentContentTypeLayout,
        modifiedData,
        moveComponentDown,
        moveComponentField,
        moveComponentUp,
        moveRelation,
        onChange: handleChange,
        onPublish: handlePublish,
        onUnpublish: handleUnpublish,
        onRemoveRelation,
        readActionAllowedFields,
        redirectToPreviousPage,
        removeComponentFromDynamicZone,
        removeComponentFromField,
        removeRepeatableField,
        resetData,
        slug,
        triggerFormValidation,
        updateActionAllowedFields,
      }}
    >
      <>
        <OverlayBlocker
          key="overlayBlocker"
          isOpen={status !== 'resolved'}
          {...overlayBlockerParams}
        />
        {isLoading ? (
          <LoadingIndicatorPage />
        ) : (
          <>
            <Prompt
              when={!isEqual(modifiedData, initialData)}
              message={formatMessage({ id: 'global.prompt.unsaved' })}
            />
            <form onSubmit={handleSubmit}>{children}</form>
          </>
        )}
      </>
    </EditViewDataManagerContext.Provider>
  );
};

EditViewDataManagerProvider.defaultProps = {
  redirectToPreviousPage: () => {},
};

EditViewDataManagerProvider.propTypes = {
  allLayoutData: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
  isSingleType: PropTypes.bool.isRequired,
  redirectToPreviousPage: PropTypes.func,
  slug: PropTypes.string.isRequired,
};

export default EditViewDataManagerProvider;
