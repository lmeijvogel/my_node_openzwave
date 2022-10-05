import { chain, keys, last, map } from 'lodash';

class TimeService {
  private readonly lookupTable : any;
  constructor(periodStarts) {
    this.lookupTable = periodStarts;
  }

  getPeriod(now) : string {
    const candidateKeys = chain(keys(this.lookupTable)).filter((k) => {
      const periodStart = this.stringToTimeToday(k);

      return periodStart < now;
    }).value();

    const key = last(candidateKeys);

    console.log("getPeriod: ", key, this.lookupTable[key]);
    return this.lookupTable[key];
  }

  stringToTimeToday(timeString) {
    const splittedString : string[] = timeString.split(':');
    const hoursMinutes : number[] = map(splittedString, (str) => parseInt(str, 10));

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

export default TimeService;
