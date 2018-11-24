import { Logger } from "./Logger";
import { TimeService } from "./TimeService";

class AutomaticRunner {
  private readonly fn: () => void;
  private readonly timeService: TimeService;
  private readonly periodStart: Date;
  private readonly periodEnd: Date;
  private readonly offsetProvider: Function;

  private runnerForToday;

  constructor(fn: () => void, options) {
    this.fn = fn;
    this.timeService = options.timeService;
    this.periodStart = this.timeService.stringToTimeToday(options.periodStart);
    this.periodEnd = this.timeService.stringToTimeToday(options.periodEnd);

    this.offsetProvider = options.offsetProvider;
  }

  public tick() {
    const newRunnerNeeded = !this.runnerForToday || this.runnerForToday.expired();

    if (newRunnerNeeded) {
      Logger.debug("AutomaticRunner.tick: New day");
      this.runnerForToday = new SingleDayRunner(
        this.fn,
        this.timeService,
        this.periodStart,
        this.periodEnd,
        this.offsetProvider()
      );
    }

    this.runnerForToday.tick();
  }
}

class SingleDayRunner {
  private readonly fn: Function;
  private readonly periodStartOnToday;
  private readonly periodEndOnToday;
  private readonly timeService: TimeService;
  private readonly currentDay: Date;
  private readonly actualStartTimeToday: Date;

  private wasRunToday: boolean;

  constructor(fn: Function, timeService: TimeService, periodStart: Date, periodEnd: Date, currentOffset: number) {
    this.timeService = timeService;

    const currentDay = this.timeService.currentTime();

    this.fn = fn;
    this.periodStartOnToday = this.onDay(periodStart, currentDay);
    this.periodEndOnToday = this.onDay(periodEnd, currentDay);
    this.currentDay = currentDay;

    this.actualStartTimeToday = this.addMinutes(this.periodStartOnToday, currentOffset);

    Logger.debug(`SingleDayRunner.tick: Determined start time for today: ${this.actualStartTimeToday}`);

    this.wasRunToday = false;
  }

  public tick() {
    const currentTime = this.timeService.currentTime();

    if (!this.wasRunToday && this.actualStartTimeToday < currentTime && currentTime < this.periodEndOnToday) {
      Logger.info("SingleDayRunner.tick: Run given function");
      this.fn.call(this);
      this.wasRunToday = true; // Do not run again: It should not be necessary (the state shouldn't change)
      // and even if it changed, it was probably a manual action that did not need
      // to be overridden by a scheduler.
    } else {
      Logger.debug("SingleDayRunner.tick: Not running function");
    }
  }

  public expired(): boolean {
    const currentTime = this.timeService.currentTime();

    return currentTime.getDate() !== this.currentDay.getDate();
  }

  private onDay(time, day): Date {
    return new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      time.getHours(),
      time.getMinutes(),
      time.getSeconds()
    );
  }

  private addMinutes(time, minutes): Date {
    return new Date(time.getFullYear(), time.getMonth(), time.getDate(), time.getHours(), time.getMinutes() + minutes);
  }
}

export { AutomaticRunner };
