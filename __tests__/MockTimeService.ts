import { ITimeService } from '../TimeService';

class MockTimeService implements ITimeService {
  private period : string;
  private time : Date;

  constructor(period, time) {
    this.period = period;
    this.time = time;
  }

  public getPeriod(now : Date) : string {
    return this.period;
  }

  public currentTime() : Date {
    return this.time;
  }
}

export { MockTimeService };
