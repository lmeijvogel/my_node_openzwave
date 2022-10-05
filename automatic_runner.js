'use strict';

const _ = require('lodash');
const Logger = require('./logger');

function AutomaticRunner(fn, options) {
  const timeService = options.timeService;

  const periodStart = timeService.stringToTimeToday(options.periodStart);
  const periodEnd = timeService.stringToTimeToday(options.periodEnd);
  const offsetProvider = options.offsetProvider;

  let lastRecordedTime = null;

  let actualStartTimeToday = null;
  let wasRunToday = false;

  function tick() {
    const currentTime = timeService.currentTime();
    const isNewDay = lastRecordedTime && currentTime.getDate() !== lastRecordedTime.getDate();

    const periodStartOnToday = onDay(periodStart, currentTime);
    const periodEndOnToday = onDay(periodEnd, currentTime);

    if (isNewDay) {
      Logger.debug('AutomaticRunner.tick: New day');
      actualStartTimeToday = null;
      wasRunToday = false;
    }

    lastRecordedTime = currentTime;

    if (currentTime < periodEndOnToday && actualStartTimeToday === null) {
      const currentOffset = offsetProvider();

      Logger.debug('AutomaticRunner.tick: current offset:', currentOffset);

      actualStartTimeToday = addMinutes(periodStartOnToday, currentOffset);
      Logger.debug('AutomaticRunner.tick: Determined start time for today: ', actualStartTimeToday);
    }

    Logger.debug('AutomaticRunner.tick: wasRunToday:', wasRunToday,
        'actualStartTimeToday:', actualStartTimeToday,
        'currentTime:', currentTime,
        'periodEndOnToday', periodEndOnToday);

    if (!wasRunToday && actualStartTimeToday && actualStartTimeToday < currentTime && currentTime < periodEndOnToday) {
      Logger.info('AutomaticRunner.tick: Run given function');
      fn.call();
      wasRunToday = true; // Do not run again: It should not be necessary (the state shouldn't change)
                          // and even if it changed, it was probably a manual action that did not need
                          // to be overridden by a scheduler.
    } else {
      Logger.debug('AutomaticRunner.tick: Not running function');
    }
  }

  function addMinutes(time, minutes) {
    return new Date(time.getFullYear(),
                    time.getMonth(),
                    time.getDate(),
                    time.getHours(),
                    time.getMinutes() + minutes);
  }

  function onDay(time, day) {
    return new Date(day.getFullYear(),
                    day.getMonth(),
                    day.getDate(),
                    time.getHours(),
                    time.getMinutes(),
                    time.getSeconds());
  };

  return {
    tick: tick
  };
};

module.exports = AutomaticRunner;
