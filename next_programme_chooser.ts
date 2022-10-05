'use strict';

import Logger from './logger';
import TimeService from './time_service';
import { ITimeService } from './time_service';
import { ITimeStateMachine } from './time_state_machine';
import { TimePeriod } from './time_service';

class NextProgrammeChooser {
  private readonly timeService: ITimeService;
  private readonly stateMachines: Map<TimePeriod, ITimeStateMachine>; // { 'morning': ITimeStateMachine }

  constructor(timeService : ITimeService, stateMachines : Map<TimePeriod, ITimeStateMachine>) {
    Logger.debug("NextProgrammeChooser.constructor: Initializing with timeService", timeService,"and stateMachines", [...stateMachines]);
    this.timeService = timeService;
    this.stateMachines = stateMachines;
  }

  handle(event, currentState : string) : string {
    Logger.debug('NextProgrammeChooser.handle: currentState:', JSON.stringify(currentState));

    const currentStateMachine = this.chooseStateMachine();

    const newState = currentStateMachine.handle(event, currentState);

    Logger.verbose('NextProgrammeChooser.handle: new currentState:', newState);

    return newState;
  }

  chooseStateMachine() : ITimeStateMachine {
    const now = this.timeService.currentTime();

    const currentPeriod : TimePeriod = this.timeService.getPeriod(now);

    Logger.debug('NextProgrammeChooser.chooseStateMachine: Time is', now.toString());
    Logger.debug('NextProgrammeChooser.chooseStateMachine: currentPeriod is', currentPeriod);

    const stateMachine = this.stateMachines.get(currentPeriod);

    if (stateMachine) {
      return stateMachine;
    } else {
      Logger.error('NextProgrammeChooser.chooseStateMachine: Unknown time');

      const result = this.stateMachines.get('morning');

      if (!result) {
        throw "Error!: Unknown time and unknown default stateMachine 'morning'"
      }

      return result;
    }
  }
}

export default NextProgrammeChooser;
