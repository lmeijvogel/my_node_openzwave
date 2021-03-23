import { Logger } from "./Logger";
import { ITimeService, TimePeriod } from "./TimeService";
import { SwitchPressName } from "./SwitchPressName";
import { ITimeStateMachine } from "./TimeStateMachine";

class NextProgrammeChooser {
  private readonly timeService: ITimeService;
  private readonly stateMachines: Map<TimePeriod, ITimeStateMachine>; // { 'morning': ITimeStateMachine }

  constructor(timeService: ITimeService, stateMachines: Map<TimePeriod, ITimeStateMachine>) {
    Logger.debug(
      `NextProgrammeChooser.constructor: Initializing with timeService ${timeService} and stateMachines ${[
        ...stateMachines
      ]}`
    );
    this.timeService = timeService;
    this.stateMachines = stateMachines;
  }

  handle(switchPressName: SwitchPressName, currentState: string): string {
    Logger.debug(`NextProgrammeChooser.handle: currentState: ${JSON.stringify(currentState)}`);

    const currentStateMachine = this.chooseStateMachine();

    const newState = currentStateMachine.handle(switchPressName, currentState);

    Logger.verbose(`NextProgrammeChooser.handle: new currentState: ${newState}`);

    return newState;
  }

  /* The aux switches (i.e. all switches that generate scenes, except the
   * main one) only switch to the most likely programme and to the off programme.
   *
   * I envision these swithes to be used when entering the house or exiting the house only.
   */
  handleAuxPress(currentState: string): string {
    Logger.debug("NextProgrammeChooser.defaultState");

    const currentStateMachine = this.chooseStateMachine();

    const defaultState = currentStateMachine.defaultState();

    if (currentState !== defaultState) {
        return defaultState;
    } else  {
        return "off";
    }
  }

  chooseStateMachine(): ITimeStateMachine {
    const now = this.timeService.currentTime();

    const currentPeriod: TimePeriod = this.timeService.getPeriod(now);

    Logger.debug(`NextProgrammeChooser.chooseStateMachine: Time is ${now.toString()}`);
    Logger.debug(`NextProgrammeChooser.chooseStateMachine: currentPeriod is ${currentPeriod}`);

    const stateMachine = this.stateMachines.get(currentPeriod);

    if (stateMachine) {
      return stateMachine;
    } else {
      Logger.error("NextProgrammeChooser.chooseStateMachine: Unknown time");

      const result = this.stateMachines.get("morning");

      if (!result) {
        throw "Error!: Unknown time and unknown default stateMachine 'morning'";
      }

      return result;
    }
  }
}

export { NextProgrammeChooser };
