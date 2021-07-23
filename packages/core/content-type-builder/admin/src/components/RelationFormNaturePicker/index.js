import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { useDispatch } from 'react-redux';
import get from 'lodash/get';
import truncate from 'lodash/truncate';
import pluralize from 'pluralize';
import useDataManager from '../../hooks/useDataManager';
import { ON_CHANGE_RELATION_TYPE } from '../FormModal/constants';
import ManyToMany from '../../icons/ManyToMany';
import ManyToOne from '../../icons/ManyToOne';
import ManyWay from '../../icons/ManyWay';
import OneToMany from '../../icons/OneToMany';
import OneToOne from '../../icons/OneToOne';
import OneWay from '../../icons/OneWay';
import getTrad from '../../utils/getTrad';
import Wrapper from './Wrapper';

const relations = {
  oneWay: OneWay,
  oneToOne: OneToOne,
  oneToMany: OneToMany,
  manyToOne: ManyToOne,
  manyToMany: ManyToMany,
  manyWay: ManyWay,
};

const RelationFormNaturePicker = ({
  naturePickerType,
  oneThatIsCreatingARelationWithAnother,
  relationType,
  target,
}) => {
  const dispatch = useDispatch();

  const { contentTypes, modifiedData } = useDataManager();
  const ctRelations = ['oneWay', 'oneToOne', 'oneToMany', 'manyToOne', 'manyToMany', 'manyWay'];
  const componentRelations = ['oneWay', 'manyWay'];
  const dataType =
    naturePickerType === 'contentType'
      ? get(modifiedData, [naturePickerType, 'schema', 'kind'], '')
      : naturePickerType;
  const relationsType = dataType === 'collectionType' ? ctRelations : componentRelations;

  const areDisplayedNamesInverted = relationType === 'manyToOne';
  const targetLabel = get(contentTypes, [target, 'schema', 'name'], 'unknown');
  const leftTarget = areDisplayedNamesInverted
    ? targetLabel
    : oneThatIsCreatingARelationWithAnother;
  const rightTarget = areDisplayedNamesInverted
    ? oneThatIsCreatingARelationWithAnother
    : targetLabel;
  const leftDisplayedValue = pluralize(leftTarget, relationType === 'manyToMany' ? 2 : 1);
  const restrictedRelations = get(contentTypes, [target, 'schema', 'restrictRelationsTo'], null);

  const rightDisplayedValue = pluralize(
    rightTarget,
    ['manyToMany', 'oneToMany', 'manyToOne', 'manyWay'].includes(relationType) ? 2 : 1
  );

  return (
    <Wrapper>
      <div className="nature-container">
        <div className="nature-buttons">
          {relationsType.map(relation => {
            const Asset = relations[relation];
            const isEnabled =
              restrictedRelations === null || restrictedRelations.includes(relation);

            return (
              <Asset
                key={relation}
                isSelected={relationType === relation}
                style={{ cursor: isEnabled ? 'pointer' : 'not-allowed' }}
                onClick={() => {
                  if (isEnabled) {
                    dispatch({
                      type: ON_CHANGE_RELATION_TYPE,
                      target: {
                        oneThatIsCreatingARelationWithAnother,
                        targetContentType: target,
                        value: relation,
                      },
                    });
                  }
                }}
              />
            );
          })}
        </div>
        <div className="nature-txt">
          <span>{truncate(leftDisplayedValue, { length: 24 })}</span>
          &nbsp;
          <FormattedMessage id={getTrad(`relation.${relationType}`)} />
          &nbsp;
          <span>{truncate(rightDisplayedValue, { length: 24 })}</span>
        </div>
      </div>
    </Wrapper>
  );
};

RelationFormNaturePicker.propTypes = {
  naturePickerType: PropTypes.string.isRequired,
  oneThatIsCreatingARelationWithAnother: PropTypes.string.isRequired,
  relationType: PropTypes.string.isRequired,
  target: PropTypes.string.isRequired,
};

export default RelationFormNaturePicker;
