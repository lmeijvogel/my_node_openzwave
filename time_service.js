'use strict';

const _ = require('lodash');

function TimeService(config) {
  if (!config.periodStarts) {
    throw 'No periodStarts defined in config';
  }

  const lookupTable = config.periodStarts;

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

  return {
    getPeriod: getPeriod
  };
}

module.exports = TimeService;
