'use strict';
const Ticker = require('./ticker');
const AutomaticRunner = require('./automatic_runner');

const _ = require('lodash');

module.exports = function (options) {
  const timeService = options.timeService;
  const onFunction  = options.onFunction;
  const offFunction = options.offFunction;

  let startCallbacks = [];
  let stopCallbacks  = [];

  let onTicker  = null;
  let offTicker = null;

  let _meanStartTime = null;
  let _meanEndTime = null;

  function start(meanStartTime, meanEndTime) {
    const offsetProvider = () => 15 - Math.round(Math.random() * 30);

    _meanStartTime = meanStartTime;
    _meanEndTime = meanEndTime;

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

    triggerStarted(meanStartTime, meanEndTime);
  }

  function stop() {
    _meanStartTime = null;
    _meanEndTime = null;

    triggerStopped();

    if (onTicker) {
      onTicker.stop();
    }

    if (offTicker) {
      offTicker.stop();
    }
  }

  function onStart(callback) {
    startCallbacks.push(callback);
  }

  function onStop(callback) {
    stopCallbacks.push(callback);
  }

  function triggerStarted(startTime, endTime) {
    _.each(startCallbacks, function (callback) {
      callback(startTime, endTime);
    });
  }

  function triggerStopped(startTime, endTime) {
    _.each(stopCallbacks, function (callback) {
      callback();
    });
  }

  function getState() {
    return {
      state: _meanStartTime !== null,
      meanStartTime: _meanStartTime,
      meanEndTime: _meanEndTime
    }
  }

  return {
    start: start,
    stop: stop,
    getState: getState,
    onStart: onStart,
    onStop: onStop
  };
};
