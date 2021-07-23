import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { AttributeIcon, IconLinks } from '@buffetjs/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import pluginId from '../../pluginId';
import useDataManager from '../../hooks/useDataManager';
import getAttributeDisplayedType from '../../utils/getAttributeDisplayedType';
import getTrad from '../../utils/getTrad';
import Curve from '../../icons/Curve';
import UpperFist from '../UpperFirst';
import Wrapper from './Wrapper';

function ListRow({
  configurable,
  name,
  dzName,
  onClick,
  plugin,
  target,
  targetUid,
  type,
  mainTypeName,
  editTarget,
  firstLoopComponentName,
  firstLoopComponentUid,
  isFromDynamicZone,
  repeatable,
  secondLoopComponentName,
  secondLoopComponentUid,
  isNestedInDZComponent,
}) {
  const { contentTypes, isInDevelopmentMode, modifiedData, removeAttribute } = useDataManager();
  // TODO
  const isMorph = target === '*';
  const ico = ['integer', 'biginteger', 'float', 'decimal'].includes(type) ? 'number' : type;

  let readableType = type;

  if (['integer', 'biginteger', 'float', 'decimal'].includes(type)) {
    readableType = 'number';
  } else if (['string'].includes(type)) {
    readableType = 'text';
  }

  const contentTypeFriendlyName = get(contentTypes, [target, 'schema', 'name'], '');
  const src = target ? 'relation' : ico;

  const handleClick = () => {
    if (isMorph) {
      return;
    }

    if (configurable !== false) {
      const firstComponentCategory = get(
        modifiedData,
        ['components', firstLoopComponentUid, 'category'],
        null
      );
      const secondComponentCategory = get(
        modifiedData,
        ['components', secondLoopComponentUid, 'category'],
        null
      );

      const attrType = type;
      const icoType = getAttributeDisplayedType(attrType);

      let firstHeaderObject = {
        header_label_1: mainTypeName,
        header_icon_name_1: icoType,
        header_icon_isCustom_1: false,
        header_info_category_1: null,
        header_info_name_1: null,
      };
      let secondHeaderObject = {
        header_label_2: name,
        header_icon_name_2: null,
        header_icon_isCustom_2: false,
        header_info_category_2: null,
        header_info_name_2: null,
      };
      let thirdHeaderObject = {
        header_icon_name_3: 'component',
        header_icon_isCustom_3: false,
        header_info_category_3: null,
        header_info_name_3: null,
      };
      let fourthHeaderObject = {
        header_icon_name_4: null,
        header_icon_isCustom_4: false,
        header_info_category_4: null,
        header_info_name_4: null,
      };
      let fifthHeaderObject = {
        header_icon_name_5: null,
        header_icon_isCustom_5: false,
        header_info_category_5: null,
        header_info_name_5: null,
      };

      if (firstLoopComponentName) {
        secondHeaderObject = {
          header_label_2: firstLoopComponentName,
          header_icon_name_2: 'component',
          header_icon_isCustom_2: false,
          header_info_category_2: firstComponentCategory,
          header_info_name_2: firstLoopComponentName,
        };

        thirdHeaderObject = {
          ...thirdHeaderObject,
          header_label_3: name,
          header_icon_name_3: null,
        };
      }

      if (secondLoopComponentUid) {
        thirdHeaderObject = {
          ...thirdHeaderObject,
          header_label_3: secondLoopComponentName,
          header_icon_name_3: 'component',
          header_info_category_3: secondComponentCategory,
          header_info_name_3: secondLoopComponentName,
        };
        fourthHeaderObject = {
          ...fourthHeaderObject,
          header_label_4: name,
          header_icon_name_4: null,
        };
      }

      if (isFromDynamicZone || isNestedInDZComponent) {
        secondHeaderObject = {
          header_label_2: dzName,
          header_icon_name_2: 'dynamiczone',
          header_icon_isCustom_2: false,
          header_info_name_2: null,
          header_info_category_2: null,
        };
        thirdHeaderObject = {
          header_icon_name_3: 'component',
          header_label_3: firstLoopComponentName,
          header_info_name_3: firstComponentCategory,
          header_info_category_3: firstComponentCategory,
        };

        if (!isNestedInDZComponent) {
          fourthHeaderObject = {
            header_icon_name_4: null,
            header_icon_isCustom_4: false,
            header_info_category_4: null,
            header_label_4: name,
          };
        } else {
          fourthHeaderObject = {
            header_icon_name_4: 'components',
            header_icon_isCustom_4: false,
            header_info_category_4: secondComponentCategory,
            header_info_name_4: secondLoopComponentName,
            header_label_4: secondLoopComponentName,
          };

          fifthHeaderObject = {
            ...fifthHeaderObject,
            header_label_5: name,
          };
        }
      }

      onClick(
        // Tells where the attribute is located in the main modifiedData object : contentType, component or components
        editTarget,
        // main data type uid
        secondLoopComponentUid || firstLoopComponentUid || targetUid,
        // Name of the attribute
        name,
        // Type of the attribute
        attrType,
        firstHeaderObject,
        secondHeaderObject,
        thirdHeaderObject,
        fourthHeaderObject,
        fifthHeaderObject
      );
    }
  };
  let loopNumber;

  if (secondLoopComponentUid && firstLoopComponentUid) {
    loopNumber = 2;
  } else if (firstLoopComponentUid) {
    loopNumber = 1;
  } else {
    loopNumber = 0;
  }

  return (
    <Wrapper
      onClick={handleClick}
      className={[target ? 'relation-row' : '', configurable ? 'clickable' : '']}
      loopNumber={loopNumber}
    >
      <td>
        <AttributeIcon key={src} type={src} />
        <Curve fill={isFromDynamicZone ? '#AED4FB' : '#f3f4f4'} />
      </td>
      <td style={{ fontWeight: 600 }}>
        <p>{name}</p>
      </td>
      <td>
        {target ? (
          <div>
            <FormattedMessage
              id={`${pluginId}.modelPage.attribute.${
                isMorph ? 'relation-polymorphic' : 'relationWith'
              }`}
            />
            &nbsp;
            <FormattedMessage id={`${pluginId}.from`}>
              {msg => (
                <span style={{ fontStyle: 'italic' }}>
                  <UpperFist content={contentTypeFriendlyName} />
                  &nbsp;
                  {plugin && `(${msg}: ${plugin})`}
                </span>
              )}
            </FormattedMessage>
          </div>
        ) : (
          <>
            <FormattedMessage id={`${pluginId}.attribute.${readableType}`} defaultMessage={type} />
            &nbsp;
            {repeatable && <FormattedMessage id={getTrad('component.repeatable')} />}
          </>
        )}
      </td>
      <td className="button-container">
        {isInDevelopmentMode && (
          <>
            {configurable ? (
              <>
                {!isMorph ? (
                  <IconLinks
                    links={[
                      {
                        icon: <FontAwesomeIcon icon="pencil-alt" />,
                        onClick: () => handleClick(),
                      },
                      {
                        icon: <FontAwesomeIcon icon="trash-alt" />,
                        onClick: e => {
                          e.stopPropagation();
                          removeAttribute(
                            editTarget,
                            name,
                            secondLoopComponentUid || firstLoopComponentUid || ''
                          );
                        },
                      },
                    ]}
                  />
                ) : (
                  <IconLinks
                    links={[
                      {
                        icon: <FontAwesomeIcon icon="trash-alt" />,
                        onClick: e => {
                          e.stopPropagation();
                          removeAttribute(
                            editTarget,
                            name,
                            secondLoopComponentUid || firstLoopComponentUid || ''
                          );
                        },
                      },
                    ]}
                  />
                )}
              </>
            ) : (
              <button type="button">
                <FontAwesomeIcon icon="lock" />
              </button>
            )}
          </>
        )}
      </td>
    </Wrapper>
  );
}

ListRow.defaultProps = {
  configurable: true,
  dzName: null,
  firstLoopComponentName: null,
  firstLoopComponentUid: null,
  isFromDynamicZone: false,
  isNestedInDZComponent: false,
  onClick: () => {},
  plugin: null,
  repeatable: false,
  secondLoopComponentName: null,
  secondLoopComponentUid: null,
  target: null,
  targetUid: null,
  type: null,
};

ListRow.propTypes = {
  configurable: PropTypes.bool,
  dzName: PropTypes.string,
  editTarget: PropTypes.string.isRequired,
  firstLoopComponentName: PropTypes.string,
  firstLoopComponentUid: PropTypes.string,
  isFromDynamicZone: PropTypes.bool,
  isNestedInDZComponent: PropTypes.bool,
  mainTypeName: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  plugin: PropTypes.string,
  repeatable: PropTypes.bool,
  secondLoopComponentName: PropTypes.string,
  secondLoopComponentUid: PropTypes.string,
  target: PropTypes.string,
  targetUid: PropTypes.string,
  type: PropTypes.string,
};

export default memo(ListRow);
export { ListRow };
