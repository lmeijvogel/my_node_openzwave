'use strict';

import Logger from './logger';

function AutomaticRunner(fn, options) {
  const timeService = options.timeService;

  const periodStart = timeService.stringToTimeToday(options.periodStart);
  const periodEnd = timeService.stringToTimeToday(options.periodEnd);
  const offsetProvider = options.offsetProvider;

  let runnerForToday = null;

  function SingleDayRunner(fn, currentDay, periodStart, periodEnd, currentOffset) {
    const periodStartOnToday = onDay(periodStart, currentDay);
    const periodEndOnToday = onDay(periodEnd, currentDay);

    const actualStartTimeToday = addMinutes(periodStartOnToday, currentOffset);

    Logger.debug('SingleDayRunner.tick: Determined start time for today: ', actualStartTimeToday);

    let wasRunToday = false;

    function tick() {
      const currentTime = timeService.currentTime();

      if (!wasRunToday && actualStartTimeToday < currentTime && currentTime < periodEndOnToday) {
        Logger.info('SingleDayRunner.tick: Run given function');
        fn.call();
        wasRunToday = true; // Do not run again: It should not be necessary (the state shouldn't change)
                            // and even if it changed, it was probably a manual action that did not need
                            // to be overridden by a scheduler.
      } else {
        Logger.debug('SingleDayRunner.tick: Not running function');
      }
    }

    function expired() {
      const currentTime = timeService.currentTime();

      return currentTime.getDate() !== currentDay.getDate();
    }

    return {
      tick: tick,
      expired: expired
    };
  }

  function tick() {
    const newRunnerNeeded = !runnerForToday || runnerForToday.expired();

    if (newRunnerNeeded) {
      Logger.debug('AutomaticRunner.tick: New day');
      runnerForToday = SingleDayRunner(fn, timeService.currentTime(), periodStart, periodEnd, offsetProvider());
    }

    runnerForToday.tick();
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

export default AutomaticRunner;
