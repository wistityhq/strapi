import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { useIntl } from 'react-intl';
import getRelationType from '../../utils/getRelationType';
import RelationFormBox from '../RelationFormBox';
import RelationFormNaturePicker from '../RelationFormNaturePicker';
import Wrapper from './Wrapper';

const RelationForm = ({ errors, mainBoxHeader, modifiedData, naturePickerType, onChange }) => {
  const { formatMessage } = useIntl();
  const getError = name => {
    const errorId = get(errors, [name, 'id'], null);

    return isEmpty(errorId) ? null : formatMessage({ id: errorId });
  };

  const relationType = getRelationType(modifiedData.relation, modifiedData.targetAttribute);

  return (
    <Wrapper>
      <RelationFormBox
        isMain
        header={mainBoxHeader}
        error={getError('name')}
        name="name"
        onChange={onChange}
        value={get(modifiedData, 'name', '')}
      />
      <RelationFormNaturePicker
        naturePickerType={naturePickerType}
        oneThatIsCreatingARelationWithAnother={mainBoxHeader}
        relationType={relationType}
        target={modifiedData.target}
      />
      <RelationFormBox
        disabled={['oneWay', 'manyWay'].includes(relationType)}
        error={getError('targetAttribute')}
        name="targetAttribute"
        onChange={onChange}
        oneThatIsCreatingARelationWithAnother={mainBoxHeader}
        target={modifiedData.target}
        value={get(modifiedData, 'targetAttribute', '')}
      />
    </Wrapper>
  );
};

RelationForm.defaultProps = {
  errors: {},
  modifiedData: {},
};

RelationForm.propTypes = {
  errors: PropTypes.object,
  mainBoxHeader: PropTypes.string.isRequired,
  modifiedData: PropTypes.object,
  naturePickerType: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default RelationForm;
