'use strict';

import * as winston from 'winston';
import { each, map, padStart, values } from 'lodash';

class WinstonLogger {
  private logger : winston;

  constructor() {
    this.logger = this.createLogger();
  }

  // Don't enable logging to file by default since it would then also do
  // that while running tests
  enableLogToFile(filename, level) {
    this.logger = this.createLogger(filename, level);
  }

  setSilent(silent) {
    each(this.logger.transports, (transport) => {
      transport.silent = silent;
    });
  }

  debug(message, ...args) {
    this._log('debug', message, ...args);
  }
  verbose(message, ...args) {
    this._log('verbose', message, ...args);
  }
  info(message, ...args) {
    this._log('info', message, ...args);
  }
  warn(message, ...args) {
    this._log('warn', message, ...args);
  }
  error(message, ...args) {
    this._log('error', message, ...args);
  }

  _log(level, ...params) {
    const args = [level].concat(values(params));

    this.logger.log.apply(this.logger, args);
  }

  createLogger(filename = null, level = 'info') {
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

    let   dateParts = [now.getFullYear(), now.getMonth(), now.getDate()];
    const timeParts = [now.getHours(), now.getMinutes(), now.getSeconds()];

    dateParts[1]++;

    const datePart = this.padToTwoZeros(dateParts).join('-');
    const timePart = this.padToTwoZeros(timeParts).join(':');

    return datePart + ' ' + timePart;
  }

  padToTwoZeros(parts) {
    return map(parts, val => padStart('' + val, 2, '0'));
  }
}

export default new WinstonLogger();
