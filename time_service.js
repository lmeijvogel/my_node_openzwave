'use strict';

const _ = require('lodash');

function TimeService(periodStarts) {
  const lookupTable = periodStarts;

  function getPeriod(now) {
    const candidateKeys = _.chain(_.keys(lookupTable)).filter(function (k) {
      const periodStart = stringToTimeToday(k);

      return periodStart < now;
    }).value();

    const key = _.last(candidateKeys);

    return lookupTable[key];
  }

  function stringToTimeToday(timeString) {
    const splittedString = timeString.split(':');
    const hoursMinutes = _.map(splittedString, function (str) {
      return parseInt(str, 10);
    });

    const hours = hoursMinutes[0];
    const minutes = hoursMinutes[1];

    let result = new Date();

    result.setHours(hours);
    result.setMinutes(minutes);
    result.setSeconds(0);

    return result;
  }

  function currentTime() {
    return new Date();
  }

  return {
    currentTime: currentTime,
    getPeriod: getPeriod,
    stringToTimeToday: stringToTimeToday
  };
}

module.exports = TimeService;
