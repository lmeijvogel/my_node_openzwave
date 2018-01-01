'use strict';

const winston = require('winston');
const _       = require('lodash');

class WinstonLogger {
  constructor() {
    this.logger = this.createLogger();
  }

  // Don't enable logging to file by default since it would then also do
  // that while running tests
  enableLogToFile(filename, level) {
    this.logger = this.createLogger(filename, level);
  }

  setSilent(silent) {
    _.each(this.logger.transports, (transport) => {
      transport.silent = silent;
    });
  }

  debug() {
    this._log('debug', arguments);
  }
  verbose() {
    this._log('verbose', arguments);
  }
  info() {
    this._log('info', arguments);
  }
  warn() {
    this._log('warn', arguments);
  }
  error() {
    this._log('error', arguments);
  }

  _log(level, params) {
    const args = [level].concat(_.values(params));

    this.logger.log.apply(this.logger, args);
  }

  createLogger(filename, level) {
    const transports = [
      new winston.transports.Console({'timestamp': this.timestamp.bind(this), 'level': 'info'})
    ];

    if (filename) {
      transports.push(new winston.transports.File({'filename': filename, 'timestamp': true, 'level': level}));
    }

    return new winston.Logger({
      transports: transports
    });
  }

  timestamp() {
    const now = new Date();

    let   dateParts = this.getValues(now, ['getFullYear', 'getMonth', 'getDate']);
    const timeParts = this.getValues(now, ['getHours', 'getMinutes', 'getSeconds']);

    dateParts[1]++;

    const datePart = this.padToTwoZeros(dateParts).join('-');
    const timePart = this.padToTwoZeros(timeParts).join(':');

    return datePart + ' ' + timePart;
  }

  getValues(now, functionNames) {
    return _(functionNames).map(fn => now[fn].call(now)).value();
  }

  padToTwoZeros(parts) {
    return _.map(parts, val => _.padStart('' + val, 2, '0'));
  }
}

module.exports = new WinstonLogger();
