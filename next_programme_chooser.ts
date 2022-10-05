'use strict';

import Logger from './logger';
import TimeService from './time_service';
import TimeStateMachine from './time_state_machine';

class NextProgrammeChooser {
  private readonly timeService: TimeService;
  private readonly stateMachines: any; // { 'morning': TimeStateMachine }

  constructor(timeService, stateMachines) {
    this.timeService = timeService;
    this.stateMachines = stateMachines;
  }

  handle(event, currentState) {
    Logger.debug('NextProgrammeChooser.handle: currentState: ', currentState);

    const currentStateMachine = this.chooseStateMachine();

    const newState = currentStateMachine.handle(event, currentState);

    Logger.verbose('NextProgrammeChooser.handle: new currentState: ', newState);

    return newState;
  }

  chooseStateMachine() : TimeStateMachine {
    const now = new Date();

    const currentPeriod = this.timeService.getPeriod(now);

    Logger.debug('NextProgrammeChooser.chooseStateMachine: Time is ', now);
    Logger.debug('NextProgrammeChooser.chooseStateMachine: currentPeriod is ', currentPeriod);

    const stateMachine = this.stateMachines[currentPeriod];

    if (stateMachine) {
      return stateMachine;
    } else {
      Logger.error('NextProgrammeChooser.chooseStateMachine: Unknown time');

      return this.stateMachines.morning;
    }
  }
}

export default NextProgrammeChooser;
