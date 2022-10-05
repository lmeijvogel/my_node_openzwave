import { forOwn, last, map } from "lodash";
import { Configuration } from "./Configuration";
import { Logger } from "./Logger";

export type TimePeriod = string;

interface ITimeService {
  getPeriod(now: Date): TimePeriod;
  currentTime(): Date;
}

class TimeService implements ITimeService {
  constructor(private config: Configuration) { }

  getPeriod(now): TimePeriod {
    Logger.debug(`TimeService.getPeriod: lookupTable: ${JSON.stringify([...this.lookupTable])}`);
    const candidateKeys: string[] = [];

    this.lookupTable.forEach((_, key) => {
      const periodStart = this.stringToTimeToday(key);

      if (periodStart < now) {
        candidateKeys.push(key);
      }
    });

    Logger.debug(`TimeService.getPeriod: candidateKeys: ${JSON.stringify(candidateKeys)}`);
    const key = last(candidateKeys);

    Logger.debug(`TimeService.getPeriod: key: ${JSON.stringify(key)}`);
    if (key) {
      Logger.debug(`TimeService.getPeriod: lookupTable has key: ${this.lookupTable.has(key)}`);
      const result = this.lookupTable.get(key);

      if (result) {
        Logger.debug(`TimeService.getPeriod: result: ${JSON.stringify(result)}`);
        return result;
      } else {
        Logger.info("TimeService.getPeriod: no result");
      }
    }

    return this.lookupTable.values().next().value;
  }

  public stringToTimeToday(timeString): Date {
    const splittedString: string[] = timeString.split(":");
    const hoursMinutes: number[] = map(splittedString, str => parseInt(str, 10));

    const hours = hoursMinutes[0];
    const minutes = hoursMinutes[1];

    let result = new Date();

    result.setHours(hours);
    result.setMinutes(minutes);
    result.setSeconds(0);

    return result;
  }

  public currentTime(): Date {
    return new Date();
  }

  get lookupTable(): Map<string, TimePeriod> {
      const periodStarts = this.config.periodStarts;

    let result = new Map<string, TimePeriod>();

    forOwn(periodStarts, (value, key) => {
      result.set(key, value);
    });

    return result;
  }
}

export { TimeService };
export { ITimeService };
