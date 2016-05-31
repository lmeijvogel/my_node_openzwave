'use strict';

const Logger = require('./logger');

function Ticker(name) {
  let ticker = null;

  const start = function (callable, interval) {
    Logger.debug('Ticker.start: Entered for "', name, '", interval:', interval);
    if (!interval) {
      throw 'No interval defined!';
    }

    if (!ticker) {
      Logger.debug('Ticker.start: No ticker yet, starting');
      ticker = setInterval(function () {
        callable.tick();
      }, interval);

      Logger.debug('Ticker.start: Ticker "', name, '" started', ticker);
    }
  };

  const stop = function () {
    Logger.debug('Ticker.stop: Entered for "', name, '"', ticker);
    if (ticker) {
      Logger.debug('Ticker.stop: Ticker exists, stopping');
      clearInterval(ticker);
      ticker = null;
    }
  };

  return {
    start: start,
    stop: stop
  };
}

module.exports = Ticker;
