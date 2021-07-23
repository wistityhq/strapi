import React from 'react';
import PropTypes from 'prop-types';
import { Inputs } from '@buffetjs/custom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useIntl } from 'react-intl';
import getTrad from '../../utils/getTrad';
import RelationTargetPicker from '../RelationTargetPicker';
import Wrapper from './Wrapper';

const RelationFormBox = ({
  disabled,
  error,
  header,
  isMain,
  name,
  onChange,
  oneThatIsCreatingARelationWithAnother,
  target,
  value,
}) => {
  const { formatMessage } = useIntl();

  return (
    <Wrapper>
      <div className="box-header">
        {isMain ? (
          <p>
            <FontAwesomeIcon
              icon={['far', 'caret-square-right']}
              style={{ fontSize: 12, marginTop: '-3px' }}
            />
            {header}
          </p>
        ) : (
          <RelationTargetPicker
            target={target}
            oneThatIsCreatingARelationWithAnother={oneThatIsCreatingARelationWithAnother}
          />
        )}
      </div>
      <div className="box-body">
        <Inputs
          autoFocus={isMain}
          disabled={disabled}
          label={formatMessage({
            id: getTrad('form.attribute.item.defineRelation.fieldName'),
          })}
          error={error}
          type="text"
          onChange={onChange}
          name={name}
          value={value}
        />
      </div>
    </Wrapper>
  );
};

RelationFormBox.defaultProps = {
  disabled: false,
  error: null,
  header: null,
  isMain: false,
  onChange: () => {},
  oneThatIsCreatingARelationWithAnother: null,
  target: null,
  value: '',
};

RelationFormBox.propTypes = {
  disabled: PropTypes.bool,
  error: PropTypes.string,
  header: PropTypes.string,
  isMain: PropTypes.bool,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  oneThatIsCreatingARelationWithAnother: PropTypes.string,
  target: PropTypes.string,
  value: PropTypes.string,
};

export default RelationFormBox;
