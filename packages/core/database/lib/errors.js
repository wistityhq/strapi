'use strict';

class NotNullConstraint extends Error {
  constructor({ column = '' } = {}) {
    super();
    this.name = 'NotNullConstraint';
    this.message = `Not null constraint violation${column ? `on on column ${column}` : ''}.`;
    this.stack = null;
  }
}

module.exports = {
  NotNullConstraint,
};
