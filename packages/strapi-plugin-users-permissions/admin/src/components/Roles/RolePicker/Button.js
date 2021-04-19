import React from 'react';
import PropTypes from 'prop-types';
import { Carret } from 'strapi-helper-plugin';

const Button = ({ isOpen, label }) => {
  return (
    <>
      {label}
      <Carret isUp={isOpen} fill={isOpen ? '#007eff' : '#292b2c'} />
    </>
  );
};

Button.defaultProps = {
  isOpen: false,
  label: '',
};

Button.propTypes = {
  isOpen: PropTypes.bool,
  label: PropTypes.string,
};

export default Button;
