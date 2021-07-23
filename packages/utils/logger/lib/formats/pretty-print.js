'use strict';

const { format } = require('winston');
const { isString } = require('lodash/fp');
const logErrors = require('./log-errors');

const { combine, timestamp, colorize, printf } = format;

const defaultTimestampFormat = 'YYYY-MM-DD HH:mm:ss.SSS';

/**
 * Create a pretty print formatter for a winston logger
 * @param {string|boolean} timestamps - Enable or disable timestamps print if it's a boolean value. Use the given format for the timestamps if it's a string
 * @param {boolean} colors - Enable or disable the use of colors for the log level
 */
module.exports = ({ timestamps = true, colors = true } = {}) => {
  const handlers = [];

  if (timestamps) {
    handlers.push(
      timestamp({
        format: isString(timestamps) ? timestamps : defaultTimestampFormat,
      })
    );
  }

  if (colors) {
    handlers.push(colorize());
  }

  handlers.push(logErrors());

  handlers.push(
    printf(({ level, message, timestamp }) => {
      return `${timestamps ? `[${timestamp}] ` : ''}${level}: ${message}`;
    })
  );

  return combine(...handlers);
};
