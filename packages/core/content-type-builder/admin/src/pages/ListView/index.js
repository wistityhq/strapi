import React, { useEffect, useState } from 'react';
import { Prompt, useHistory, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { get, has, isEqual } from 'lodash';
import { BackHeader, ListWrapper, useTracking } from '@strapi/helper-plugin';
import { useIntl } from 'react-intl';
import { Header } from '@buffetjs/custom';
import ListViewContext from '../../contexts/ListViewContext';
import getAttributeDisplayedType from '../../utils/getAttributeDisplayedType';
import pluginId from '../../pluginId';
import getTrad from '../../utils/getTrad';
import makeSearch from '../../utils/makeSearch';
import LeftMenu from '../../components/LeftMenu';
import ListRow from '../../components/ListRow';
import List from '../../components/List';
import ListButton from '../../components/ListButton';
import useDataManager from '../../hooks/useDataManager';
import ListHeader from '../../components/ListHeader';
import LinkToCMSettingsView from './LinkToCMSettingsView';
import Wrapper from './Wrapper';

/* eslint-disable indent */

const ListView = () => {
  const {
    initialData,
    modifiedData,
    isInDevelopmentMode,
    isInContentTypeView,
    submitData,
    toggleModalCancel,
  } = useDataManager();
  const { formatMessage } = useIntl();
  const { trackUsage } = useTracking();
  const { push, goBack } = useHistory();
  const { search } = useLocation();
  const [enablePrompt, togglePrompt] = useState(true);

  useEffect(() => {
    if (search === '') {
      togglePrompt(true);
    }
  }, [search]);

  // Disabling the prompt on the first render if one of the modal is open
  useEffect(() => {
    if (search !== '') {
      togglePrompt(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstMainDataPath = isInContentTypeView ? 'contentType' : 'component';
  const mainDataTypeAttributesPath = [firstMainDataPath, 'schema', 'attributes'];
  const targetUid = get(modifiedData, [firstMainDataPath, 'uid']);
  const isTemporary = get(modifiedData, [firstMainDataPath, 'isTemporary'], false);
  const contentTypeKind = get(modifiedData, [firstMainDataPath, 'schema', 'kind'], null);

  const attributes = get(modifiedData, mainDataTypeAttributesPath, []);
  const attributesLength = attributes.length;
  const currentDataName = get(initialData, [firstMainDataPath, 'schema', 'name'], '');
  const isFromPlugin = has(initialData, [firstMainDataPath, 'plugin']);
  const hasModelBeenModified = !isEqual(modifiedData, initialData);
  const forTarget = isInContentTypeView ? 'contentType' : 'component';

  const handleClickAddField = async (
    forTarget,
    targetUid,
    firstHeaderObj,
    secondHeaderObj,
    thirdHeaderObj,
    fourthHeaderObj
  ) => {
    // disable the prompt
    await wait();

    const searchObj = {
      modalType: 'chooseAttribute',
      forTarget,
      targetUid,
      ...firstHeaderObj,
      ...secondHeaderObj,
      ...thirdHeaderObj,
      ...fourthHeaderObj,
    };

    push({ search: makeSearch(searchObj) });
  };

  const handleClickAddComponentToDZ = async dzName => {
    const firstHeaderObject = {
      header_label_1: currentDataName,
      header_icon_name_1: 'dynamiczone',
      header_icon_isCustom_1: false,
    };
    const secondHeaderObj = {
      header_label_2: dzName,
    };
    const search = {
      modalType: 'addComponentToDynamicZone',
      forTarget: 'contentType',
      targetUid,
      dynamicZoneTarget: dzName,
      settingType: 'base',
      step: '1',
      actionType: 'edit',
      ...firstHeaderObject,
      ...secondHeaderObj,
    };

    await wait();

    push({ search: makeSearch(search, true) });
  };

  const handleClickEditField = async (
    forTarget,
    targetUid,
    attributeName,
    type,
    firstHeaderObj,
    secondHeaderObj,
    thirdHeaderObj,
    fourthHeaderObj,
    fifthHeaderObj
  ) => {
    const attributeType = getAttributeDisplayedType(type);

    await wait();

    const search = {
      modalType: 'attribute',
      actionType: 'edit',
      settingType: 'base',
      forTarget,
      targetUid,
      attributeName,
      attributeType,
      step: type === 'component' ? '2' : null,
      ...firstHeaderObj,
      ...secondHeaderObj,
      ...thirdHeaderObj,
      ...fourthHeaderObj,
      ...fifthHeaderObj,
    };

    await wait();

    push({ search: makeSearch(search, true) });
  };

  const getDescription = () => {
    const description = get(modifiedData, [firstMainDataPath, 'schema', 'description'], null);

    return (
      description ||
      formatMessage({
        id: `${pluginId}.modelPage.contentHeader.emptyDescription.description`,
      })
    );
  };

  const wait = async () => {
    togglePrompt(false);

    return new Promise(resolve => setTimeout(resolve, 100));
  };
  const label = get(modifiedData, [firstMainDataPath, 'schema', 'name'], '');
  const kind = get(modifiedData, [firstMainDataPath, 'schema', 'kind'], '');

  const headerProps = {
    actions: isInDevelopmentMode
      ? [
          {
            color: 'cancel',
            onClick: () => {
              toggleModalCancel();
            },
            label: formatMessage({
              id: `${pluginId}.form.button.cancel`,
            }),
            type: 'button',
            disabled: isEqual(modifiedData, initialData),
          },
          {
            className: 'button-submit',
            color: 'success',
            onClick: () => submitData(),
            label: formatMessage({
              id: `${pluginId}.form.button.save`,
            }),
            type: 'submit',
            disabled: isEqual(modifiedData, initialData),
          },
        ]
      : [],
    title: {
      label,
      cta:
        isInDevelopmentMode && !isFromPlugin
          ? {
              icon: 'pencil-alt',
              onClick: async () => {
                await wait();

                const contentType = kind || firstMainDataPath;

                if (contentType === 'collectionType') {
                  trackUsage('willEditNameOfContentType');
                }
                if (contentType === 'singleType') {
                  trackUsage('willEditNameOfSingleType');
                }

                push({
                  search: makeSearch({
                    modalType: firstMainDataPath,
                    actionType: 'edit',
                    settingType: 'base',
                    forTarget: firstMainDataPath,
                    targetUid,
                    header_label_1: label,
                    header_icon_isCustom_1: false,
                    header_icon_name_1:
                      contentType === 'singleType' ? contentType : firstMainDataPath,
                    headerId: getTrad('modalForm.header-edit'),
                  }),
                });
              },
            }
          : null,
    },
    content: getDescription(),
  };

  const listTitle = [
    formatMessage(
      {
        id: `${pluginId}.table.attributes.title.${attributesLength > 1 ? 'plural' : 'singular'}`,
      },
      { number: attributesLength }
    ),
  ];

  const addButtonProps = {
    icon: true,
    color: 'primary',
    label: formatMessage({ id: `${pluginId}.button.attributes.add.another` }),
    onClick: () => {
      const headerDisplayObject = {
        header_label_1: currentDataName,
        header_icon_name_1: forTarget === 'contentType' ? contentTypeKind : forTarget,
        header_icon_isCustom_1: false,
      };
      handleClickAddField(forTarget, targetUid, headerDisplayObject);
    },
  };

  const listInjectedComponents = (
    <LinkToCMSettingsView
      key="link-to-cm-settings-view"
      targetUid={targetUid}
      isTemporary={isTemporary}
      isInContentTypeView={isInContentTypeView}
      contentTypeKind={contentTypeKind}
    />
  );

  const listActions = isInDevelopmentMode
    ? [listInjectedComponents, <ListButton {...addButtonProps} key="add-button" />]
    : listInjectedComponents;

  const CustomRow = props => {
    const { name } = props;

    return <ListRow {...props} attributeName={name} name={name} onClick={handleClickEditField} />;
  };

  CustomRow.defaultProps = {
    name: null,
  };

  CustomRow.propTypes = {
    name: PropTypes.string,
  };

  return (
    <ListViewContext.Provider value={{ openModalAddField: handleClickAddField }}>
      <Wrapper>
        <BackHeader onClick={goBack} />
        <Prompt
          message={formatMessage({ id: getTrad('prompt.unsaved') })}
          when={hasModelBeenModified && enablePrompt}
        />
        <div className="container-fluid">
          <div className="row">
            <LeftMenu wait={wait} />
            <div className="col-md-9 content" style={{ paddingLeft: '30px', paddingRight: '30px' }}>
              <Header {...headerProps} />

              <ListWrapper style={{ marginBottom: 80 }}>
                <ListHeader actions={listActions} title={listTitle} />
                <List
                  items={attributes}
                  customRowComponent={props => <CustomRow {...props} />}
                  addComponentToDZ={handleClickAddComponentToDZ}
                  targetUid={targetUid}
                  dataType={forTarget}
                  dataTypeName={currentDataName}
                  mainTypeName={currentDataName}
                  editTarget={forTarget}
                  isMain
                />
              </ListWrapper>
            </div>
          </div>
        </div>
      </Wrapper>
    </ListViewContext.Provider>
  );
};

export default ListView;
