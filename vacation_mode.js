'use strict';
const Ticker = require('./ticker');
const AutomaticRunner = require('./automatic_runner');
const Logger = require('./logger');

module.exports = function (options) {
  const store       = options.store;
  const timeService = options.timeService;
  const onFunction  = options.onFunction;
  const offFunction = options.offFunction;

  let onTicker  = null;
  let offTicker = null;

  store.getVacationMode().then(function (data) {
    if (data.state === 'on') {
      Logger.info('Vacation mode was still on. Enabling.');

      start(data.start_time, data.end_time);
    }
  });

  function start(meanStartTime, meanEndTime) {
    const offsetProvider = () => 15 - Math.round(Math.random() * 30);

    onTicker = new Ticker('startProgramme');
    onTicker.start(AutomaticRunner(onFunction, {
      periodStart: meanStartTime,
      periodEnd: meanEndTime,
      timeService: timeService,
      offsetProvider: offsetProvider
    }), 15000);

    offTicker = new Ticker('endProgramme');
    offTicker.start(AutomaticRunner(offFunction, {
      periodStart: meanEndTime,
      periodEnd: '23:59',
      timeService: timeService,
      offsetProvider: offsetProvider
    }), 15000);

    store.vacationModeStarted(meanStartTime, meanEndTime);
  }

  function stop() {
    if (onTicker) {
      onTicker.stop();
    }

    if (offTicker) {
      offTicker.stop();
    }

    store.vacationModeStopped();
  }

  return {
    start: start,
    stop: stop,
  };
};
