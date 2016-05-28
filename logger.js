'use strict';

const winston = require('winston');
const _       = require('lodash');

function WinstonLogger() {
  let logger = createLogger();

  // Don't enable logging to file by default since it would then also do
  // that while running tests
  function enableLogToFile(filename, level) {
    logger = createLogger(filename, level);
  }

  function setSilent(silent) {
    _.each(logger.transports, function (transport) {
      transport.silent = silent;
    });
  }

  function debug() {
    _log('debug', arguments);
  }
  function verbose() {
    _log('verbose', arguments);
  }
  function info() {
    _log('info', arguments);
  }
  function warn() {
    _log('warn', arguments);
  }
  function error() {
    _log('error', arguments);
  }

  function _log(level, params) {
    const args = [level].concat(_.values(params));

    logger.log.apply(logger, args);
  }

  function createLogger(filename, level) {
    const transports = [
      new winston.transports.Console({'timestamp': timestamp, 'level': 'info'})
    ];

    if (filename) {
      transports.push(new winston.transports.File({'filename': filename, 'timestamp': true, 'level': level}));
    }

    return new winston.Logger({
      transports: transports
    });
  }

  function timestamp() {
    const now = new Date();

    let   dateParts = getValues(now, ['getFullYear', 'getMonth', 'getDate']);
    const timeParts = getValues(now, ['getHours', 'getMinutes', 'getSeconds']);

    dateParts[1]++;

    const datePart = padToTwoZeros(dateParts).join('-');
    const timePart = padToTwoZeros(timeParts).join(':');

    return datePart + ' ' + timePart;
  }

  function getValues(now, functionNames) {
    return _(functionNames).map(function (fn) {
      return now[fn].call(now);
    }).value();
  }

  function padToTwoZeros(parts) {
    return _.map(parts, function (val) {
      return _.padStart('' + val, 2, '0');
    });
  }

  return {
    enableLogToFile: enableLogToFile,
    setSilent: setSilent,
    debug: debug,
    verbose: verbose,
    info: info,
    warn: warn,
    error: error
  };
}

module.exports = new WinstonLogger();
