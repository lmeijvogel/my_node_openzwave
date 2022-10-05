'use strict';

const _ = require('lodash');

class TimeService {
  constructor(periodStarts) {
    this.lookupTable = periodStarts;
  }

  getPeriod(now) {
    const candidateKeys = _.chain(_.keys(this.lookupTable)).filter((k) => {
      const periodStart = this.stringToTimeToday(k);

      return periodStart < now;
    }).value();

    const key = _.last(candidateKeys);

    return this.lookupTable[key];
  }

  stringToTimeToday(timeString) {
    const splittedString = timeString.split(':');
    const hoursMinutes = _.map(splittedString, (str) => parseInt(str, 10));

    const hours = hoursMinutes[0];
    const minutes = hoursMinutes[1];

    let result = new Date();

    result.setHours(hours);
    result.setMinutes(minutes);
    result.setSeconds(0);

    return result;
  }

  currentTime() {
    return new Date();
  }
}

module.exports = TimeService;
