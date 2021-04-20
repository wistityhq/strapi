import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  HeaderModal,
  HeaderModalTitle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalForm,
  PopUpWarning,
  getYupInnerErrors,
  useGlobalContext,
  useQuery,
  InputsIndex,
} from 'strapi-helper-plugin';
import { Button, Text, Padded } from '@buffetjs/core';
import { Inputs } from '@buffetjs/custom';

import { useHistory, useLocation } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { get, has, isEmpty, set, toLower, toString, upperFirst } from 'lodash';
import pluginId from '../../pluginId';
import useDataManager from '../../hooks/useDataManager';
import AttributeOption from '../../components/AttributeOption';
import BooleanBox from '../../components/BooleanBox';
import ComponentIconPicker from '../../components/ComponentIconPicker';
import CustomCheckbox from '../../components/CustomCheckbox';
import ModalHeader from '../../components/ModalHeader';
import HeaderModalNavContainer from '../../components/HeaderModalNavContainer';
import RelationForm from '../../components/RelationForm';
import HeaderNavLink from '../../components/HeaderNavLink';
import WrapperSelect from '../../components/WrapperSelect';
import getTrad from '../../utils/getTrad';
import makeSearch from '../../utils/makeSearch';
import getAttributes from './utils/attributes';
import forms from './utils/forms';
import createHeadersArray from './utils/createHeadersArray';
import createHeadersObjectFromArray from './utils/createHeadersObjectFromArray';
import { createComponentUid, createUid } from './utils/createUid';
import getModalTitleSubHeader from './utils/getModalTitleSubHeader';
import getNextSearch from './utils/getNextSearch';
import { NAVLINKS, INITIAL_STATE_DATA } from './utils/staticData';
import init from './init';
import reducer, { initialState } from './reducer';
import CustomButton from './CustomButton';
import canEditContentType from './utils/canEditContentType';

/* eslint-disable indent */
/* eslint-disable react/no-array-index-key */

const FormModal = () => {
  const [state, setState] = useState(INITIAL_STATE_DATA);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [reducerState, dispatch] = useReducer(reducer, initialState, init);
  const { push } = useHistory();
  const { search } = useLocation();
  const { emitEvent, formatMessage } = useGlobalContext();
  const query = useQuery();
  const attributeOptionRef = useRef();

  const {
    addAttribute,
    addCreatedComponentToDynamicZone,
    allComponentsCategories,
    changeDynamicZoneComponents,
    contentTypes,
    components,
    createSchema,
    deleteCategory,
    deleteData,
    editCategory,
    submitData,
    modifiedData: allDataSchema,
    nestedComponents,
    setModifiedData,
    sortedContentTypesList,
    updateSchema,
    reservedNames,
  } = useDataManager();
  const {
    componentToCreate,
    formErrors,
    initialData,
    isCreatingComponentWhileAddingAField,
    modifiedData,
  } = reducerState.toJS();

  useEffect(() => {
    if (!isEmpty(search)) {
      const actionType = query.get('actionType');
      // Returns 'null' if there isn't any attributeType search params
      const attributeName = query.get('attributeName');
      const attributeType = query.get('attributeType');
      const dynamicZoneTarget = query.get('dynamicZoneTarget');
      const forTarget = query.get('forTarget');
      const modalType = query.get('modalType');
      const kind = query.get('kind') || get(allDataSchema, ['contentType', 'schema', 'kind'], null);
      const targetUid = query.get('targetUid');
      const settingType = query.get('settingType');
      const headerId = query.get('headerId');
      const header_label_1 = query.get('header_label_1');
      const header_icon_name_1 = query.get('header_icon_name_1');
      const header_icon_isCustom_1 = query.get('header_icon_isCustom_1');
      const header_info_category_1 = query.get('header_info_category_1');
      const header_info_name_1 = query.get('header_info_name_1');
      const header_label_2 = query.get('header_label_2');
      const header_icon_name_2 = query.get('header_icon_name_2');
      const header_icon_isCustom_2 = query.get('header_icon_isCustom_2');
      const header_info_category_2 = query.get('header_info_category_2');
      const header_info_name_2 = query.get('header_info_name_2');
      const header_label_3 = query.get('header_label_3');
      const header_icon_name_3 = query.get('header_icon_name_3');
      const header_icon_isCustom_3 = query.get('header_icon_isCustom_3');
      const header_info_category_3 = query.get('header_info_category_3');
      const header_info_name_3 = query.get('header_info_name_3');
      const header_label_4 = query.get('header_label_4');
      const header_icon_name_4 = query.get('header_icon_name_4');
      const header_icon_isCustom_4 = query.get('header_icon_isCustom_4');
      const header_info_category_4 = query.get('header_info_category_4');
      const header_info_name_4 = query.get('header_info_name_4');
      const header_label_5 = query.get('header_label_5');
      const header_icon_name_5 = query.get('header_icon_name_5');
      const header_icon_isCustom_5 = query.get('header_icon_isCustom_5');
      const header_info_category_5 = query.get('header_info_category_5');
      const header_info_name_5 = query.get('header_info_name_5');
      const step = query.get('step');
      const pathToSchema =
        forTarget === 'contentType' || forTarget === 'component'
          ? [forTarget]
          : [forTarget, targetUid];

      setState({
        actionType,
        attributeName,
        attributeType,
        kind,
        dynamicZoneTarget,
        forTarget,
        modalType,
        pathToSchema,
        settingType,
        step,
        targetUid,
        header_label_1,
        header_icon_name_1,
        header_icon_isCustom_1,
        header_info_name_1,
        header_info_category_1,
        header_label_2,
        header_icon_name_2,
        header_icon_isCustom_2,
        header_info_name_2,
        header_info_category_2,
        header_label_3,
        header_icon_name_3,
        header_icon_isCustom_3,
        header_info_name_3,
        header_info_category_3,
        header_label_4,
        header_icon_name_4,
        header_icon_isCustom_4,
        header_info_name_4,
        header_info_category_4,
        header_label_5,
        header_icon_name_5,
        header_icon_isCustom_5,
        header_info_name_5,
        header_info_category_5,
        headerId,
      });

      const collectionTypesForRelation = sortedContentTypesList.filter(
        ({ kind }) => kind === 'collectionType'
      );

      // Reset all the modification when opening the edit category modal
      if (modalType === 'editCategory') {
        setModifiedData();
      }

      if (actionType === 'edit' && modalType === 'attribute' && forTarget === 'contentType') {
        emitEvent('willEditFieldOfContentType');
      }

      // Case:
      // the user opens the modal chooseAttributes
      // selects dynamic zone => set the field name
      // then goes to step 1 (the modal is addComponentToDynamicZone) and finally reloads the app.
      // In this particular if the user tries to add components to the zone it will pop an error since the dz is unknown
      const shouldCloseModalToPreventErrorWhenCreatingADZ =
        get(allDataSchema, [...pathToSchema, 'schema', 'attributes', dynamicZoneTarget], null) ===
          null && modalType === 'addComponentToDynamicZone';

      // Similarly when creating a component on the fly if the user reloads the app
      // The previous data is lost
      // Since the modal uses the search it will still be opened
      const shouldCloseModalChooseAttribute =
        get(allDataSchema, ['components', targetUid], null) === null &&
        // modalType === 'chooseAttribute' &&
        forTarget === 'components';

      if (shouldCloseModalToPreventErrorWhenCreatingADZ || shouldCloseModalChooseAttribute) {
        push({ search: '' });
      }

      // Edit category
      if (modalType === 'editCategory' && actionType === 'edit') {
        dispatch({
          type: 'SET_DATA_TO_EDIT',
          data: {
            name: query.get('categoryName'),
          },
        });
      }

      // Create content type we need to add the default option draftAndPublish
      if (
        modalType === 'contentType' &&
        state.modalType !== 'contentType' && // Prevent setting the data structure when navigating from one tab to another
        actionType === 'create'
      ) {
        dispatch({
          type: 'SET_DATA_TO_EDIT',
          data: {
            draftAndPublish: true,
          },
        });
      }

      // Edit content type
      if (
        modalType === 'contentType' &&
        state.modalType !== 'contentType' &&
        actionType === 'edit'
      ) {
        const { name, collectionName, draftAndPublish, kind } = get(
          allDataSchema,
          [...pathToSchema, 'schema'],
          {
            name: null,
            collectionName: null,
          }
        );

        dispatch({
          type: 'SET_DATA_TO_EDIT',
          data: {
            name,
            collectionName,
            draftAndPublish,
            kind,
          },
        });
      }

      // Edit component
      if (modalType === 'component' && state.modalType !== 'component' && actionType === 'edit') {
        const data = get(allDataSchema, pathToSchema, {});

        dispatch({
          type: 'SET_DATA_TO_EDIT',
          data: {
            name: data.schema.name,
            category: data.category,
            icon: data.schema.icon,
            collectionName: data.schema.collectionName,
          },
        });
      }

      // Special case for the dynamic zone
      if (
        modalType === 'addComponentToDynamicZone' &&
        state.modalType !== 'addComponentToDynamicZone' &&
        actionType === 'edit'
      ) {
        const attributeToEditNotFormatted = get(
          allDataSchema,
          [...pathToSchema, 'schema', 'attributes', dynamicZoneTarget],
          {}
        );
        const attributeToEdit = {
          ...attributeToEditNotFormatted,
          // We filter the available components
          // Because this modal is only used for adding components
          components: [],
          name: dynamicZoneTarget,
          createComponent: false,
          componentToCreate: { type: 'component' },
        };

        dispatch({
          type: 'SET_DYNAMIC_ZONE_DATA_SCHEMA',
          attributeToEdit,
        });
      }

      // Set the predefined data structure to create an attribute
      if (
        attributeType &&
        attributeType !== 'null' &&
        // This condition is added to prevent the reducer state to be cleared when navigating from the base tab to tha advanced one
        state.modalType !== 'attribute'
      ) {
        const attributeToEditNotFormatted = get(
          allDataSchema,
          [...pathToSchema, 'schema', 'attributes', attributeName],
          {}
        );
        const attributeToEdit = {
          ...attributeToEditNotFormatted,
          name: attributeName,
        };

        // We need to set the repeatable key to false when editing a component
        // The API doesn't send this info
        if (attributeType === 'component' && actionType === 'edit') {
          if (!attributeToEdit.repeatable) {
            set(attributeToEdit, 'repeatable', false);
          }
        }

        if (attributeType === 'relation' && !has(attributeToEdit, ['targetAttribute'])) {
          set(attributeToEdit, ['targetAttribute'], '-');
        }

        dispatch({
          type: 'SET_ATTRIBUTE_DATA_SCHEMA',
          attributeType,
          nameToSetForRelation: get(collectionTypesForRelation, ['0', 'title'], 'error'),
          targetUid: get(collectionTypesForRelation, ['0', 'uid'], 'error'),
          isEditing: actionType === 'edit',
          modifiedDataToSetForEditing: attributeToEdit,
          step,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const form = get(forms, [state.modalType, 'form', state.settingType], () => ({
    items: [],
  }));
  const headers = createHeadersArray(state);

  const isCreatingContentType = state.modalType === 'contentType';
  const isCreatingComponent = state.modalType === 'component';
  const isCreatingAttribute = state.modalType === 'attribute';
  const isComponentAttribute = state.attributeType === 'component' && isCreatingAttribute;

  const isCreating = state.actionType === 'create';
  const isCreatingComponentFromAView =
    get(modifiedData, 'createComponent', false) || isCreatingComponentWhileAddingAField;
  const isInFirstComponentStep = state.step === '1';
  const isEditingCategory = state.modalType === 'editCategory';
  const isOpen = !isEmpty(search);
  const isPickingAttribute = state.modalType === 'chooseAttribute';
  const uid = createUid(modifiedData.name || '');
  const attributes = get(allDataSchema, [...state.pathToSchema, 'schema', 'attributes'], null);

  const checkFormValidity = async () => {
    let schema;

    const dataToValidate =
      isCreatingComponentFromAView && state.step === '1'
        ? get(modifiedData, 'componentToCreate', {})
        : modifiedData;

    // Check form validity for content type
    if (isCreatingContentType) {
      schema = forms.contentType.schema(
        Object.keys(contentTypes),
        state.actionType === 'edit',
        // currentUID
        get(allDataSchema, [...state.pathToSchema, 'uid'], null),
        reservedNames
      );

      // Check form validity for component
      // This is happening when the user click on the link from the left menu
    } else if (isCreatingComponent) {
      schema = forms.component.schema(
        Object.keys(components),
        modifiedData.category || '',
        reservedNames,
        state.actionType === 'edit',
        get(allDataSchema, [...state.pathToSchema, 'uid'], null)
      );

      // Check for validity for creating a component
      // This is happening when the user creates a component "on the fly"
      // Since we temporarily store the component info in another object
      // The data is set in the componentToCreate key
    } else if (isComponentAttribute && isCreatingComponentFromAView && isInFirstComponentStep) {
      schema = forms.component.schema(
        Object.keys(components),
        get(modifiedData, 'componentToCreate.category', ''),
        reservedNames
      );

      // Check form validity for creating a 'common attribute'
      // We need to make sure that it is independent from the step
    } else if (isCreatingAttribute && !isInFirstComponentStep) {
      const type = state.attributeType === 'relation' ? 'relation' : modifiedData.type;

      let alreadyTakenTargetContentTypeAttributes = [];

      if (type === 'relation') {
        const targetContentTypeUID = get(modifiedData, ['target'], null);
        const targetContentTypeAttributes = get(
          contentTypes,
          [targetContentTypeUID, 'schema', 'attributes'],
          {}
        );

        // Create an array with all the targetContentType attributes name
        // in order to prevent the user from creating a relation with a targetAttribute
        // that may exist in the other content type
        alreadyTakenTargetContentTypeAttributes = Object.keys(targetContentTypeAttributes).filter(
          attrName => {
            // Keep all the target content type attributes when creating a relation
            if (state.actionType !== 'edit') {
              return true;
            }

            // Remove the already created one when editing
            return attrName !== initialData.targetAttribute;
          }
        );
      }
      schema = forms[state.modalType].schema(
        get(allDataSchema, state.pathToSchema, {}),
        type,
        modifiedData,
        state.actionType === 'edit',
        state.attributeName,
        initialData,
        alreadyTakenTargetContentTypeAttributes,
        reservedNames
      );
    } else if (isEditingCategory) {
      schema = forms.editCategory.schema(allComponentsCategories, initialData);
    } else {
      // The user is either in the addComponentToDynamicZone modal or
      // in step 1 of the add component (modalType=attribute&attributeType=component) but not creating a component

      // eslint-disable-next-line no-lonely-if
      if (isInFirstComponentStep && isCreatingComponentFromAView) {
        schema = forms.component.schema(
          Object.keys(components),
          get(modifiedData, 'componentToCreate.category', ''),
          reservedNames
        );
      } else {
        // The form is valid
        // The case here is being in the addComponentToDynamicZone modal and not creating a component
        return;
      }
    }

    await schema.validate(dataToValidate, { abortEarly: false });
  };

  // TODO this should be a util for testing
  const getButtonSubmitMessage = () => {
    const { attributeType, modalType } = state;
    const isCreatingAComponent = get(modifiedData, 'createComponent', false);
    let tradId;

    switch (modalType) {
      case 'contentType':
      case 'component':
      case 'editCategory':
        tradId = !isCreating ? getTrad('form.button.finish') : getTrad('form.button.continue');
        break;
      case 'addComponentToDynamicZone': {
        tradId = isCreatingAComponent
          ? getTrad('form.button.add-first-field-to-created-component')
          : getTrad('form.button.finish');
        break;
      }
      case 'attribute': {
        if (attributeType === 'dynamiczone') {
          tradId = getTrad('form.button.add-components-to-dynamiczone');
        } else if (attributeType === 'component') {
          if (isInFirstComponentStep) {
            tradId = isCreatingAComponent
              ? getTrad('form.button.configure-component')
              : getTrad('form.button.select-component');
          } else {
            tradId = isCreatingComponentWhileAddingAField
              ? getTrad('form.button.add-first-field-to-created-component')
              : getTrad('form.button.add-field');
          }
        } else {
          tradId = getTrad('form.button.add-field');
        }
        break;
      }
      default:
        tradId = getTrad('form.button.add-field');
    }

    return formatMessage({ id: tradId });
  };

  // TODO remove and use the utils/makeSearch
  const makeNextSearch = (searchObj, shouldContinue = isCreating) => {
    if (!shouldContinue) {
      return '';
    }

    return Object.keys(searchObj).reduce((acc, current, index) => {
      if (searchObj[current] !== null) {
        acc = `${acc}${index === 0 ? '' : '&'}${current}=${searchObj[current]}`;
      }

      return acc;
    }, '');
  };

  const handleClickAddComponentsToDynamicZone = ({
    target: { name, components, shouldAddComponents },
  }) => {
    dispatch({
      type: 'ADD_COMPONENTS_TO_DYNAMIC_ZONE',
      name,
      components,
      shouldAddComponents,
    });
  };

  const handleChangeMediaAllowedTypes = ({ target: { name, value } }) => {
    dispatch({
      type: 'ON_CHANGE_ALLOWED_TYPE',
      name,
      value,
    });
  };

  const toggleConfirmModal = useCallback(() => setShowConfirmModal(prev => !prev), []);

  const handleChange = useCallback(
    ({ target: { name, value, type, ...rest } }) => {
      const namesThatCanResetToNullValue = [
        'enumName',
        'max',
        'min',
        'maxLength',
        'minLength',
        'regex',
      ];

      // When toggling the draftAndPublish from true to false
      // We need to display a confirmation box
      if (name === 'draftAndPublish' && state.actionType === 'edit' && value === false) {
        toggleConfirmModal();

        return;
      }

      let val;

      if (['default', ...namesThatCanResetToNullValue].includes(name) && value === '') {
        val = null;
      } else if (
        type === 'radio' &&
        (name === 'multiple' ||
          name === 'single' ||
          name === 'createComponent' ||
          name === 'repeatable')
      ) {
        // eslint-disable-next-line no-unneeded-ternary
        val = value === 'false' ? false : true;

        // The boolean default accepts 3 different values
        // This check has been added to allow a reset to null for the bool
      } else if (type === 'radio' && name === 'default') {
        if (value === 'false') {
          val = false;
        } else if (value === 'true') {
          val = true;
        } else {
          val = null;
        }

        // We store an array for the enum
      } else if (name === 'enum') {
        val = value.split('\n');
      } else {
        val = value;
      }

      const clonedErrors = Object.assign({}, formErrors);

      // Reset min error when modifying the max
      if (name === 'max') {
        delete clonedErrors.min;
      }

      // Same here
      if (name === 'maxLength') {
        delete clonedErrors.minLength;
      }

      // Since the onBlur is deactivated we remove the errors directly when changing an input
      delete clonedErrors[name];

      dispatch({
        type: 'SET_ERRORS',
        errors: clonedErrors,
      });

      dispatch({
        type: 'ON_CHANGE',
        keys: name.split('.'),
        value: val,
        ...rest,
      });
    },
    [formErrors, state.actionType, toggleConfirmModal]
  );

  const handleConfirmDisableDraftAndPublish = useCallback(() => {
    dispatch({
      type: 'ON_CHANGE',
      keys: ['draftAndPublish'],
      value: false,
    });

    toggleConfirmModal();
  }, [toggleConfirmModal]);

  const handleSubmit = async (e, shouldContinue = isCreating) => {
    e.preventDefault();

    try {
      await checkFormValidity();
      sendButtonAddMoreFieldEvent(shouldContinue);
      const targetUid = state.forTarget === 'components' ? state.targetUid : uid;
      let headerIcon;

      if (state.forTarget === 'contentType') {
        const currentKind = get(allDataSchema, ['contentType', 'schema', 'kind'], 'contentType');

        headerIcon = state.kind || currentKind;
      } else if (state.forTarget === 'component') {
        headerIcon = 'component';
      } else {
        headerIcon = get(allDataSchema, ['components', state.targetUid, 'schema', 'icon'], '');
      }

      // Remove the last header when editing
      if (state.actionType === 'edit') {
        headers.pop();
      }

      const headersObject = createHeadersObjectFromArray(headers);
      const nextHeaderIndex = headers.length + 1;

      if (isCreatingContentType) {
        // Create the content type schema
        if (isCreating) {
          createSchema({ ...modifiedData, kind: state.kind }, state.modalType, uid);
        } else {
          if (canEditContentType(allDataSchema, modifiedData)) {
            push({ search: '' });
            submitData(modifiedData);
          } else {
            strapi.notification.toggle({
              type: 'warning',
              message: { id: 'notification.contentType.relations.conflict' },
            });
          }

          return;
        }

        push({
          pathname: `/plugins/${pluginId}/content-types/${uid}`,
          search: makeNextSearch({
            modalType: 'chooseAttribute',
            forTarget: state.forTarget,
            targetUid,
            header_label_1: modifiedData.name,
            header_icon_name_1: headerIcon,
            header_icon_isCustom_1: null,
          }),
        });
      } else if (isCreatingComponent) {
        if (isCreating) {
          // Create the component schema
          const componentUid = createComponentUid(modifiedData.name, modifiedData.category);
          const { category, ...rest } = modifiedData;

          createSchema(rest, 'component', componentUid, category);

          push({
            search: makeNextSearch({
              modalType: 'chooseAttribute',
              forTarget: state.forTarget,
              targetUid: componentUid,
              header_label_1: modifiedData.name,
              header_icon_name_1: 'contentType',
              header_icon_isCustom_1: null,
            }),
            pathname: `/plugins/${pluginId}/component-categories/${category}/${componentUid}`,
          });
        } else {
          updateSchema(modifiedData, state.modalType, state.targetUid);

          // Close the modal
          push({ search: '' });

          return;
        }
      } else if (isEditingCategory) {
        if (toLower(initialData.name) === toLower(modifiedData.name)) {
          // Close the modal
          push({ search: '' });

          return;
        }

        editCategory(initialData.name, modifiedData);

        return;
        // Add/edit a field to a content type
        // Add/edit a field to a created component (the end modal is not step 2)
      } else if (isCreatingAttribute && !isCreatingComponentFromAView) {
        // Normal fields like boolean relations or dynamic zone
        if (!isComponentAttribute) {
          addAttribute(
            modifiedData,
            state.forTarget,
            state.targetUid,
            state.actionType === 'edit',
            initialData
          );

          const isDynamicZoneAttribute = state.attributeType === 'dynamiczone';
          // Adding a component to a dynamiczone is not the same logic as creating a simple field
          // so the search is different

          const dzSearch = makeNextSearch({
            modalType: 'addComponentToDynamicZone',
            forTarget: 'contentType',
            targetUid: state.targetUid,

            dynamicZoneTarget: modifiedData.name,
            settingType: 'base',
            step: '1',
            actionType: 'create',
            ...headersObject,
            header_label_2: modifiedData.name,
            header_icon_name_2: null,
            header_icon_isCustom_2: false,
          });
          const nextSearch = isDynamicZoneAttribute
            ? dzSearch
            : makeNextSearch(
                {
                  modalType: 'chooseAttribute',
                  forTarget: state.forTarget,
                  targetUid,
                  ...headersObject,
                  header_icon_isCustom_1: !['contentType', 'component'].includes(state.forTarget),
                  header_icon_name_1: headerIcon,
                },
                shouldContinue
              );

          // The user is creating a DZ (he had entered the name of the dz)
          if (isDynamicZoneAttribute) {
            // Step 1 of adding a component to a DZ, the user has the option to create a component
            dispatch({
              type: 'RESET_PROPS_AND_SET_THE_FORM_FOR_ADDING_A_COMPO_TO_A_DZ',
            });

            push({ search: isCreating ? nextSearch : '' });

            return;
          }

          push({ search: nextSearch });

          return;

          // Adding an existing component
        }
        // eslint-disable-next-line no-lonely-if
        if (isInFirstComponentStep) {
          // Navigate the user to step 2
          const nextSearchObj = {
            modalType: 'attribute',
            actionType: state.actionType,
            settingType: 'base',
            forTarget: state.forTarget,
            targetUid: state.targetUid,
            attributeType: 'component',
            step: '2',
            ...headersObject,
            header_icon_isCustom_1: !['contentType', 'component'].includes(state.forTarget),
            header_icon_name_1: headerIcon,
          };

          push({
            search: makeNextSearch(nextSearchObj, shouldContinue),
          });

          // Clear the reducer and prepare the modified data
          // This way we don't have to add some logic to re-run the useEffect
          // The first step is either needed to create a component or just to navigate
          // To the modal for adding a "common field"
          dispatch({
            type: 'RESET_PROPS_AND_SET_FORM_FOR_ADDING_AN_EXISTING_COMPO',
          });

          // We don't want all the props to be reset
          return;

          // Here we are in step 2
          // The step 2 is also use to edit an attribute that is a component
        }

        addAttribute(
          modifiedData,
          state.forTarget,
          state.targetUid,
          // This change the dispatched type
          // either 'EDIT_ATTRIBUTE' or 'ADD_ATTRIBUTE' in the DataManagerProvider
          state.actionType === 'edit',
          // This is for the edit part
          initialData,
          // Passing true will add the component to the components object
          // This way we can add fields to the added component (if it wasn't there already)
          true
        );
        const nextSearch = {
          modalType: 'chooseAttribute',
          forTarget: state.forTarget,
          targetUid: state.targetUid,
          ...headersObject,
          header_icon_isCustom_1: !['contentType', 'component'].includes(state.forTarget),
          header_icon_name_1: headerIcon,
        };

        push({ search: makeSearch(nextSearch, shouldContinue) });

        // We don't need to end the loop here we want the reducer to be reinitialised

        // Logic for creating a component without clicking on the link in
        // the left menu
        // We need to separate the logic otherwise the component would be created
        // even though the user didn't set any field
        // We need to prevent the component from being created if the user closes the modal at step 2 without any submission
      } else if (isCreatingAttribute && isCreatingComponentFromAView) {
        // Step 1
        if (isInFirstComponentStep) {
          // Here the search could be refactored since it is the same as the case from above
          // Navigate the user to step 2

          let searchObj = {
            modalType: 'attribute',
            actionType: state.actionType,
            settingType: 'base',
            forTarget: state.forTarget,
            targetUid: state.targetUid,
            attributeType: 'component',
            step: '2',
            ...headersObject,
            header_icon_isCustom_1: false,
            header_icon_name_1: 'component',
          };

          emitEvent('willCreateComponentFromAttributesModal');

          push({
            search: makeNextSearch(searchObj, shouldContinue),
          });

          // Here we clear the reducer state but we also keep the created component
          // If we were to create the component before
          dispatch({
            type: 'RESET_PROPS_AND_SAVE_CURRENT_DATA',
          });

          // Terminate because we don't want the reducer to be entirely reset
          return;

          // Step 2 of creating a component (which is setting the attribute name in the parent's schema)
        }
        // We are destructuring because the modifiedData object doesn't have the appropriate format to create a field
        const { category, type, ...rest } = componentToCreate;
        // Create a the component temp UID
        // This could be refactored but I think it's more understandable to separate the logic
        const componentUid = createComponentUid(componentToCreate.name, category);
        // Create the component first and add it to the components data
        createSchema(
          // Component data
          rest,
          // Type will always be component
          // It will dispatch the CREATE_COMPONENT_SCHEMA action
          // So the component will be added in the main components object
          // This might not be needed if we don't allow navigation between entries while editing
          type,
          componentUid,
          category,
          // This will add the created component in the datamanager modifiedData components key
          // Like explained above we will be able to modify the created component structure
          isCreatingComponentFromAView
        );
        // Add the field to the schema
        addAttribute(modifiedData, state.forTarget, state.targetUid, false);

        dispatch({ type: 'RESET_PROPS' });

        // Open modal attribute for adding attr to component

        const searchToOpenModalAttributeToAddAttributesToAComponent = {
          modalType: 'chooseAttribute',
          forTarget: 'components',
          targetUid: componentUid,
          ...headersObject,
          header_icon_isCustom_1: true,
          header_icon_name_1: componentToCreate.icon,
          [`header_label_${nextHeaderIndex}`]: modifiedData.name,
          [`header_icon_name_${nextHeaderIndex}`]: 'component',
          [`header_icon_isCustom_${nextHeaderIndex}`]: false,
          [`header_info_category_${nextHeaderIndex}`]: category,
          [`header_info_name_${nextHeaderIndex}`]: componentToCreate.name,
        };

        push({
          search: makeNextSearch(
            searchToOpenModalAttributeToAddAttributesToAComponent,
            shouldContinue
          ),
        });

        return;

        // The modal is addComponentToDynamicZone
      } else {
        // The modal is addComponentToDynamicZone
        if (isInFirstComponentStep) {
          if (isCreatingComponentFromAView) {
            const { category, type, ...rest } = modifiedData.componentToCreate;
            const componentUid = createComponentUid(modifiedData.componentToCreate.name, category);
            // Create the component first and add it to the components data
            createSchema(
              // Component data
              rest,
              // Type will always be component
              // It will dispatch the CREATE_COMPONENT_SCHEMA action
              // So the component will be added in the main components object
              // This might not be needed if we don't allow navigation between entries while editing
              type,
              componentUid,
              category,
              // This will add the created component in the datamanager modifiedData components key
              // Like explained above we will be able to modify the created component structure
              isCreatingComponentFromAView
            );
            // Add the created component to the DZ
            // We don't want to remove the old ones
            addCreatedComponentToDynamicZone(state.dynamicZoneTarget, [componentUid]);

            // The Dynamic Zone and the component is created created
            // Open the modal to add fields to the created component

            const searchToOpenAddField = {
              modalType: 'chooseAttribute',
              forTarget: 'components',
              targetUid: componentUid,
              ...headersObject,
              header_icon_isCustom_1: true,
              header_icon_name_1: modifiedData.componentToCreate.icon,
              [`header_label_${nextHeaderIndex}`]: modifiedData.name,
              [`header_icon_name_${nextHeaderIndex}`]: 'component',
              [`header_icon_isCustom_${nextHeaderIndex}`]: false,
              [`header_info_category_${nextHeaderIndex}`]: category,
              [`header_info_name_${nextHeaderIndex}`]: modifiedData.componentToCreate.name,
            };

            push({ search: makeSearch(searchToOpenAddField, true) });
          } else {
            // Add the components to the DZ
            changeDynamicZoneComponents(state.dynamicZoneTarget, modifiedData.components);

            // TODO nav
            // Search to open modal add fields for the main type (content type)
            push({ search: '' });
          }
        } else {
          console.error('This case is not handled');
        }

        return;
      }

      dispatch({
        type: 'RESET_PROPS',
      });
    } catch (err) {
      const errors = getYupInnerErrors(err);

      dispatch({
        type: 'SET_ERRORS',
        errors,
      });
    }
  };
  const handleToggle = () => {
    push({ search: '' });
  };

  const onClosed = () => {
    setState(INITIAL_STATE_DATA);
    dispatch({
      type: 'RESET_PROPS',
    });
  };
  const onOpened = () => {
    if (state.modalType === 'chooseAttribute') {
      attributeOptionRef.current.focus();
    }
  };

  const sendAdvancedTabEvent = tab => {
    if (tab !== 'advanced') {
      return;
    }

    if (isCreatingContentType) {
      emitEvent('didSelectContentTypeSettings');

      return;
    }

    if (state.forTarget === 'contentType') {
      emitEvent('didSelectContentTypeFieldSettings');
    }
  };

  const sendButtonAddMoreFieldEvent = shouldContinue => {
    if (
      state.modalType === 'attribute' &&
      state.forTarget === 'contentType' &&
      state.attributeType !== 'dynamiczone' &&
      shouldContinue
    ) {
      emitEvent('willAddMoreFieldToContentType');
    }
  };

  const shouldDisableAdvancedTab = () => {
    return (
      ((state.attributeType === 'component' || state.modalType === 'addComponentToDynamicZone') &&
        get(modifiedData, ['createComponent'], null) === false) ||
      state.modalType === 'editCategory'
    );
  };

  // Display data for the attributes picker modal
  const displayedAttributes = getAttributes(
    state.forTarget,
    state.targetUid,
    // We need the nested components so we know when to remove the component option
    nestedComponents,
    attributes
  );

  // Styles
  const modalBodyStyle = isPickingAttribute ? { paddingTop: '0.5rem', paddingBottom: '3rem' } : {};

  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpened={onOpened}
        onClosed={onClosed}
        onToggle={handleToggle}
        withoverflow={toString(
          state.modalType === 'addComponentToDynamicZone' ||
            (state.modalType === 'attribute' && state.attributeType === 'media')
        )}
      >
        <HeaderModal>
          <ModalHeader headerId={state.headerId} headers={headers} />
          <section>
            <HeaderModalTitle>
              <FormattedMessage
                id={getModalTitleSubHeader(state)}
                values={{
                  type: upperFirst(
                    formatMessage({
                      id: getTrad(`attribute.${state.attributeType}`),
                    })
                  ),
                  name: upperFirst(state.attributeName),
                  step: state.step,
                }}
              >
                {msg => <span>{upperFirst(msg)}</span>}
              </FormattedMessage>

              {!isPickingAttribute && (
                <>
                  <div className="settings-tabs">
                    <HeaderModalNavContainer>
                      {NAVLINKS.map((link, index) => {
                        return (
                          <HeaderNavLink
                            // The advanced tab is disabled when adding an existing component
                            // step 1
                            isDisabled={index === 1 && shouldDisableAdvancedTab()}
                            isActive={state.settingType === link.id}
                            key={link.id}
                            {...link}
                            onClick={() => {
                              setState(prev => ({
                                ...prev,
                                settingType: link.id,
                              }));
                              sendAdvancedTabEvent(link.id);
                              push({ search: getNextSearch(link.id, state) });
                            }}
                            nextTab={index === NAVLINKS.length - 1 ? 0 : index + 1}
                          />
                        );
                      })}
                    </HeaderModalNavContainer>
                  </div>
                  <hr />
                </>
              )}
            </HeaderModalTitle>
          </section>
        </HeaderModal>
        <form onSubmit={handleSubmit}>
          <ModalForm>
            <ModalBody style={modalBodyStyle}>
              <div className="container-fluid">
                {isPickingAttribute
                  ? displayedAttributes.map((row, i) => {
                      return (
                        <div key={i} className="row">
                          {i === 1 && (
                            <hr
                              style={{
                                width: 'calc(100% - 30px)',
                                marginBottom: 16,
                                marginTop: 19,
                                borderColor: '#F0F3F8',
                              }}
                            />
                          )}
                          {row.map((attr, index) => {
                            const tabIndex =
                              i === 0 ? index : displayedAttributes[0].length + index;

                            return (
                              <AttributeOption
                                key={attr}
                                tabIndex={tabIndex}
                                isDisplayed
                                onClick={() => {}}
                                ref={i === 0 && index === 0 ? attributeOptionRef : null}
                                type={attr}
                              />
                            );
                          })}
                        </div>
                      );
                    })
                  : form(
                      modifiedData,
                      state.attributeType,
                      state.step,
                      state.actionType,
                      attributes
                    ).items.map((row, index) => {
                      return (
                        <div className="row" key={index}>
                          {row.map((input, i) => {
                            // The divider type is used mainly the advanced tab
                            // It is the one responsible for displaying the settings label
                            if (input.type === 'divider' || input.type === 'dividerDraftPublish') {
                              const tradId =
                                input.type === 'divider'
                                  ? 'form.attribute.item.settings.name'
                                  : 'form.contentType.divider.draft-publish';

                              return (
                                <div className="col-12" key="divider">
                                  <Padded bottom size="smd">
                                    <div style={{ paddingTop: 3 }} />
                                    <Text
                                      fontSize="xs"
                                      color="grey"
                                      fontWeight="bold"
                                      textTransform="uppercase"
                                    >
                                      <FormattedMessage id={getTrad(tradId)}>
                                        {txt => txt}
                                      </FormattedMessage>
                                    </Text>
                                  </Padded>
                                </div>
                              );
                            }

                            // The spacer type is used mainly to align the icon picker...
                            if (input.type === 'spacer') {
                              return <div key="spacer" style={{ height: 8 }} />;
                            }

                            // The spacer type is used mainly to align the icon picker...
                            if (input.type === 'spacer-small') {
                              return <div key={`${index}.${i}`} style={{ height: 4 }} />;
                            }

                            if (input.type === 'spacer-medium') {
                              return <div key={`${index}.${i}`} style={{ height: 8 }} />;
                            }

                            // This type is used in the addComponentToDynamicZone modal when selecting the option add an existing component
                            // It pushes select the components to the right
                            if (input.type === 'pushRight') {
                              return <div key={`${index}.${i}`} className={`col-${input.size}`} />;
                            }

                            if (input.type === 'relation') {
                              return (
                                <RelationForm
                                  key="relation"
                                  mainBoxHeader={get(headers, [0, 'label'], '')}
                                  modifiedData={modifiedData}
                                  naturePickerType={state.forTarget}
                                  onChange={handleChange}
                                  errors={formErrors}
                                />
                              );
                            }

                            // Retrieve the error for a specific input
                            const errorId = get(
                              formErrors,
                              [
                                ...input.name
                                  .split('.')
                                  // The filter here is used when creating a component
                                  // in the component step 1 modal
                                  // Since the component info is stored in the
                                  // componentToCreate object we can access the error
                                  // By removing the key
                                  .filter(key => key !== 'componentToCreate'),
                                'id',
                              ],
                              null
                            );

                            const retrievedValue = get(modifiedData, input.name, '');

                            let value;

                            // Condition for the boolean default value
                            // The radio input doesn't accept false, true or null as value
                            // So we pass them as string
                            // This way the data stays accurate and we don't have to operate
                            // any data mutation
                            if (input.name === 'default' && state.attributeType === 'boolean') {
                              value = toString(retrievedValue);
                              // Same here for the enum
                            } else if (input.name === 'enum' && Array.isArray(retrievedValue)) {
                              value = retrievedValue.join('\n');
                            } else if (input.name === 'uid') {
                              value = input.value;
                            } else if (input.name === 'allowedTypes' && retrievedValue === '') {
                              value = null;
                            } else {
                              value = retrievedValue;
                            }

                            // The addon input is not present in @buffetjs so we are using the old lib
                            // for the moment that's why we don't want them be passed to buffet
                            // like the other created inputs
                            if (input.type === 'addon') {
                              return (
                                <InputsIndex
                                  key={input.name}
                                  {...input}
                                  type="string"
                                  onChange={handleChange}
                                  value={value}
                                />
                              );
                            }

                            let type = input.type;

                            if (input.type === 'sorter') {
                              type = 'text';
                            }

                            return (
                              <div className={`col-${input.size || 6}`} key={input.name}>
                                <Inputs
                                  {...input}
                                  type={type}
                                  modifiedData={modifiedData}
                                  addComponentsToDynamicZone={handleClickAddComponentsToDynamicZone}
                                  changeMediaAllowedTypes={handleChangeMediaAllowedTypes}
                                  customInputs={{
                                    allowedTypesSelect: WrapperSelect,
                                    componentIconPicker: ComponentIconPicker,
                                    componentSelect: WrapperSelect,
                                    creatableSelect: WrapperSelect,
                                    customCheckboxWithChildren: CustomCheckbox,
                                    booleanBox: BooleanBox,
                                  }}
                                  isCreating={isCreating}
                                  // Props for the componentSelect
                                  isCreatingComponentWhileAddingAField={
                                    isCreatingComponentWhileAddingAField
                                  }
                                  // Props for the componentSelect
                                  // Since the component is created after adding it to a type
                                  // its name and category can't be retrieved from the data manager
                                  componentCategoryNeededForAddingAfieldWhileCreatingAComponent={get(
                                    componentToCreate,
                                    'category',
                                    null
                                  )}
                                  // Props for the componentSelect same explanation
                                  componentNameNeededForAddingAfieldWhileCreatingAComponent={get(
                                    componentToCreate,
                                    'name',
                                    null
                                  )}
                                  isAddingAComponentToAnotherComponent={
                                    state.forTarget === 'components' ||
                                    state.forTarget === 'component'
                                  }
                                  value={value}
                                  error={isEmpty(errorId) ? null : formatMessage({ id: errorId })}
                                  onChange={handleChange}
                                  onBlur={() => {}}
                                  description={
                                    get(input, 'description.id', null)
                                      ? formatMessage(input.description)
                                      : input.description
                                  }
                                  placeholder={
                                    get(input, 'placeholder.id', null)
                                      ? formatMessage(input.placeholder)
                                      : input.placeholder
                                  }
                                  label={
                                    get(input, 'label.id', null)
                                      ? formatMessage(input.label)
                                      : input.label
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
              </div>
            </ModalBody>
          </ModalForm>
          {!isPickingAttribute && (
            <ModalFooter>
              <section style={{ alignItems: 'center' }}>
                <Button type="button" color="cancel" onClick={handleToggle}>
                  {formatMessage({
                    id: 'app.components.Button.cancel',
                  })}
                </Button>
                <div>
                  {isCreatingAttribute && !isInFirstComponentStep && (
                    <Button
                      type={isCreating ? 'button' : 'submit'}
                      color="success"
                      onClick={e => {
                        handleSubmit(e, false);
                      }}
                      style={{ marginRight: '10px' }}
                    >
                      {formatMessage({ id: 'form.button.finish' })}
                    </Button>
                  )}
                  {(isCreatingContentType || isCreatingComponent) && !isCreating && (
                    <Button
                      type="button"
                      color="delete"
                      onClick={e => {
                        e.preventDefault();
                        deleteData();
                      }}
                      style={{ marginRight: '10px' }}
                    >
                      {formatMessage({ id: getTrad('form.button.delete') })}
                    </Button>
                  )}
                  {isEditingCategory && (
                    <Button
                      type="button"
                      color="delete"
                      onClick={e => {
                        e.preventDefault();

                        deleteCategory(initialData.name);
                      }}
                      style={{ marginRight: '10px' }}
                    >
                      {formatMessage({ id: getTrad('form.button.delete') })}
                    </Button>
                  )}
                  {isCreating && state.attributeType === 'dynamiczone' && (
                    <CustomButton
                      type={isCreating ? 'submit' : 'button'}
                      color={
                        (isCreatingContentType ||
                          isCreatingComponent ||
                          isEditingCategory ||
                          (state.modalType === 'addComponentToDynamicZone' &&
                            state.step === '1' &&
                            !isCreatingComponentFromAView)) &&
                        !isCreating
                          ? 'success'
                          : 'primary'
                      }
                      onClick={e => handleSubmit(e, true)}
                      icon={
                        (isCreatingAttribute &&
                          !isCreatingComponentFromAView &&
                          state.step !== '1') ||
                        (state.modalType === 'addComponentToDynamicZone' &&
                          isCreatingComponentFromAView) ||
                        (isCreatingComponentFromAView && state.step === '2')
                      }
                    >
                      {getButtonSubmitMessage()}
                    </CustomButton>
                  )}
                  {state.attributeType !== 'dynamiczone' && (
                    <CustomButton
                      type={isCreating ? 'submit' : 'button'}
                      color={
                        (isCreatingContentType ||
                          isCreatingComponent ||
                          isEditingCategory ||
                          (state.modalType === 'addComponentToDynamicZone' &&
                            state.step === '1' &&
                            !isCreatingComponentFromAView)) &&
                        !isCreating
                          ? 'success'
                          : 'primary'
                      }
                      onClick={e => handleSubmit(e, true)}
                      icon={
                        (isCreatingAttribute &&
                          !isCreatingComponentFromAView &&
                          state.step !== '1') ||
                        (state.modalType === 'addComponentToDynamicZone' &&
                          isCreatingComponentFromAView) ||
                        (isCreatingComponentFromAView && state.step === '2')
                      }
                    >
                      {getButtonSubmitMessage()}
                    </CustomButton>
                  )}
                </div>
              </section>
            </ModalFooter>
          )}
        </form>
      </Modal>
      {/* CONFIRM MODAL FOR DRAFT AND PUBLISH */}
      <PopUpWarning
        isOpen={showConfirmModal}
        onConfirm={handleConfirmDisableDraftAndPublish}
        toggleModal={toggleConfirmModal}
        popUpWarningType="danger"
        content={{
          message: getTrad('popUpWarning.draft-publish.message'),
          secondMessage: getTrad('popUpWarning.draft-publish.second-message'),
          confirm: getTrad('popUpWarning.draft-publish.button.confirm'),
        }}
      />
    </>
  );
};

export default FormModal;
