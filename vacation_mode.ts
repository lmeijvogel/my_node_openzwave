import { Ticker } from './ticker';
import { AutomaticRunner } from './automatic_runner';
import { TimeService } from './time_service';

import { each } from 'lodash';

class VacationMode {
  private readonly timeService : TimeService;
  private readonly onFunction : () => void;
  private readonly offFunction : () => void;

  private readonly startCallbacks : ((startTime: string, endTime: string) => void)[];
  private readonly stopCallbacks : (() => void)[];

  private onTicker : Ticker | null;
  private offTicker : Ticker | null;

  private _meanStartTime : String | null;
  private _meanEndTime : String | null;

  constructor(timeService : TimeService, onFunction : () => void, offFunction : () => void) {
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
    this.onTicker.start(new AutomaticRunner(this.onFunction, {
      periodStart: meanStartTime,
      periodEnd: meanEndTime,
      timeService: this.timeService,
      offsetProvider: offsetProvider
    }), 15000);

    this.offTicker = new Ticker('endProgramme');
    this.offTicker.start(new AutomaticRunner(this.offFunction, {
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

  onStart(callback : (startTime: string, endTime: string) => void) {
    this.startCallbacks.push(callback);
  }

  onStop(callback : () => void) {
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

export { VacationMode };
