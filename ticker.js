'use strict';

const Logger = require('./logger');

class Ticker {
  constructor(name) {
    this.ticker = null;
    this.name = name;
  }

  start(callable, interval) {
    Logger.debug('Ticker.start: Entered for "', this.name, '", interval:', interval);
    if (!interval) {
      throw 'No interval defined!';
    }

    if (!this.ticker) {
      Logger.debug('Ticker.start: No ticker yet, starting');
      this.ticker = setInterval(function () {
        callable.tick();
      }, interval);

      Logger.debug('Ticker.start: Ticker "', this.name, '" started', this.ticker);
    }
  };

  stop() {
    Logger.debug('Ticker.stop: Entered for "', this.name, '"', this.ticker);
    if (this.ticker) {
      Logger.debug('Ticker.stop: Ticker exists, stopping');
      clearInterval(this.ticker);
      this.ticker = null;
    }
  };
}

module.exports = Ticker;
