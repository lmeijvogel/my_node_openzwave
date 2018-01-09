'use strict';
import Ticker from './ticker';
import AutomaticRunner from './automatic_runner';
import TimeService from './time_service';

import { each } from 'lodash';

class VacationMode {
  private readonly timeService : TimeService;
  private readonly onFunction : Function;
  private readonly offFunction : Function;

  private readonly startCallbacks : Function[];
  private readonly stopCallbacks : Function[];

  private onTicker : Ticker;
  private offTicker : Ticker;

  private _meanStartTime : String;
  private _meanEndTime : String;

  constructor(timeService : TimeService, onFunction : Function, offFunction : Function) {
    this.timeService = timeService;
    this.onFunction  = onFunction;
    this.offFunction = offFunction;

    this.startCallbacks = [];
    this.stopCallbacks  = [];

    this.onTicker  = null;
    this.offTicker = null;

    this._meanStartTime = null;
    this._meanEndTime = null;
  }

  start(meanStartTime : string, meanEndTime : string) {
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

  triggerStarted(startTime : string, endTime : string) {
    each(this.startCallbacks, (callback) => {
      callback(startTime, endTime);
    });
  }

  triggerStopped() {
    each(this.stopCallbacks, (callback) => {
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

export default VacationMode;
