'use strict';
const Ticker = require('./ticker');
const AutomaticRunner = require('./automatic_runner');

const _ = require('lodash');

class VacationMode {
  constructor(options) {
    this.timeService = options.timeService;
    this.onFunction  = options.onFunction;
    this.offFunction = options.offFunction;

    this.startCallbacks = [];
    this.stopCallbacks  = [];

    this.onTicker  = null;
    this.offTicker = null;

    this._meanStartTime = null;
    this._meanEndTime = null;
  }

  start(meanStartTime, meanEndTime) {
    const offsetProvider = () => 15 - Math.round(Math.random() * 30);

    this._meanStartTime = meanStartTime;
    this._meanEndTime = meanEndTime;

    this.onTicker = new Ticker('startProgramme');
    this.onTicker.start(AutomaticRunner(this.onFunction, {
      periodStart: meanStartTime,
      periodEnd: meanEndTime,
      timeService: this.timeService,
      offsetProvider: offsetProvider
    }), 15000);

    this.offTicker = new Ticker('endProgramme');
    this.offTicker.start(AutomaticRunner(this.offFunction, {
      periodStart: meanEndTime,
      periodEnd: '23:59',
      timeService: this.timeService,
      offsetProvider: offsetProvider
    }), 15000);

    this.triggerStarted(meanStartTime, meanEndTime);
  }

  stop() {
    this._meanStartTime = null;
    this._meanEndTime = null;

    this.triggerStopped();

    if (this.onTicker) {
      this.onTicker.stop();
    }

    if (this.offTicker) {
      this.offTicker.stop();
    }
  }

  onStart(callback) {
    this.startCallbacks.push(callback);
  }

  onStop(callback) {
    this.stopCallbacks.push(callback);
  }

  triggerStarted(startTime, endTime) {
    _.each(this.startCallbacks, (callback) => {
      callback(startTime, endTime);
    });
  }

  triggerStopped(startTime, endTime) {
    _.each(this.stopCallbacks, (callback) => {
      callback();
    });
  }

  getState() {
    return {
      state: this._meanStartTime !== null,
      meanStartTime: this._meanStartTime,
      meanEndTime: this._meanEndTime
    };
  }
};

module.exports = VacationMode;
