'use strict';

const _ = require('lodash/fp');
const dateFns = require('date-fns');

class Field {
  constructor(config) {
    this.config = config;
  }

  // TODO: impl
  validate() {
    // // use config validators directly
    // if (this.config.validators) {
    //   this.config.validators.forEach(validator => {
    //     validator(value)
    //   })
    // }
  }

  toDB(value) {
    return value;
  }

  fromDB(value) {
    return value;
  }
}

class StringField extends Field {
  toDB(value) {
    return _.toString(value);
  }

  fromDB(value) {
    return _.toString(value);
  }
}

class JSONField extends Field {
  toDB(value) {
    return JSON.stringify(value);
  }

  fromDB(value) {
    if (typeof value === 'string') return JSON.parse(value);
    return value;
  }
}

class BooleanField extends Field {
  toDB(value) {
    if (typeof value === 'boolean') return value;

    if (['true', 't', '1', 1].includes(value)) {
      return true;
    }

    if (['false', 'f', '0', 0].includes(value)) {
      return false;
    }

    return Boolean(value);
  }

  fromDB(value) {
    if (typeof value === 'boolean') {
      return value;
    }

    const strVal = _.toString(value);

    if (strVal === '1') {
      return true;
    } else if (strVal === '0') {
      return false;
    } else {
      return null;
    }
  }
}

class NumberField extends Field {
  toDB(value) {
    const numberValue = _.toNumber(value);

    if (Number.isNaN(numberValue)) {
      throw new Error(`Expected a valid Number, got ${value}`);
    }

    return numberValue;
  }

  fromDB(value) {
    return _.toNumber(value);
  }
}

class BigIntegerField extends NumberField {
  toDB(value) {
    return _.toString(value);
  }

  fromDB(value) {
    return _.toString(value);
  }
}

const timeRegex = new RegExp('^(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]{1,3})?$');

const parseTime = value => {
  if (dateFns.isDate(value)) return dateFns.format(value, 'HH:mm:ss.SSS');

  if (typeof value !== 'string') {
    throw new Error(`Expected a string, got a ${typeof value}`);
  }
  const result = value.match(timeRegex);

  if (result === null) {
    throw new Error('Invalid time format, expected HH:mm:ss.SSS');
  }

  const [, hours, minutes, seconds, fraction = '.000'] = result;
  const fractionPart = _.padCharsEnd('0', 3, fraction.slice(1));

  return `${hours}:${minutes}:${seconds}.${fractionPart}`;
};

const parseDate = value => {
  if (dateFns.isDate(value)) return dateFns.format(value, 'yyyy-MM-dd');
  try {
    let date = dateFns.parseISO(value);

    if (dateFns.isValid(date)) return dateFns.format(date, 'yyyy-MM-dd');

    throw new Error(`Invalid format, expected an ISO compatible date`);
  } catch (error) {
    throw new Error(`Invalid format, expected an ISO compatible date`);
  }
};

const parseDateTimeOrTimestamp = value => {
  if (dateFns.isDate(value)) return value;
  try {
    const date = dateFns.parseISO(value);
    if (dateFns.isValid(date)) return date;

    const milliUnixDate = dateFns.parse(value, 'T', new Date());
    if (dateFns.isValid(milliUnixDate)) return milliUnixDate;

    throw new Error(`Invalid format, expected a timestamp or an ISO date`);
  } catch (error) {
    throw new Error(`Invalid format, expected a timestamp or an ISO date`);
  }
};

class DateField extends Field {
  toDB(value) {
    return parseDate(value);
  }

  fromDB(value) {
    const cast = new Date(value);
    return dateFns.isValid(cast) ? dateFns.formatISO(cast, { representation: 'date' }) : null;
  }
}
class DatetimeField extends Field {
  toDB(value) {
    return parseDateTimeOrTimestamp(value);
  }

  fromDB(value) {
    const cast = new Date(value);
    return dateFns.isValid(cast) ? cast.toISOString() : null;
  }
}

class TimeField extends Field {
  toDB(value) {
    return parseTime(value);
  }

  fromDB(value) {
    // make sure that's a string with valid format ?
    return value;
  }
}
class TimestampField extends Field {
  toDB(value) {
    return parseDateTimeOrTimestamp(value);
  }

  fromDB(value) {
    const cast = new Date(value);
    return dateFns.isValid(cast) ? dateFns.format(cast, 'T') : null;
  }
}

const typeToFieldMap = {
  increments: Field,
  password: StringField,
  email: StringField,
  string: StringField,
  uid: StringField,
  richtext: StringField,
  text: StringField,
  enumeration: StringField,
  json: JSONField,
  biginteger: BigIntegerField,
  integer: NumberField,
  float: NumberField,
  decimal: NumberField,
  date: DateField,
  time: TimeField,
  datetime: DatetimeField,
  timestamp: TimestampField,
  boolean: BooleanField,
};

const createField = (type /*attribute*/) => {
  if (_.has(type, typeToFieldMap)) {
    return new typeToFieldMap[type]({});
  }

  throw new Error(`Undefined field for type ${type}`);
};

module.exports = {
  createField,
};
