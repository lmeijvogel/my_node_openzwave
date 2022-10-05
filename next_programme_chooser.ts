'use strict';

import Logger from './logger';
import TimeService from './time_service';
import TimeStateMachine from './time_state_machine';

class NextProgrammeChooser {
  private readonly timeService: TimeService;
  private readonly stateMachines: Map<string, TimeStateMachine>; // { 'morning': TimeStateMachine }

  constructor(timeService, stateMachines) {
    this.timeService = timeService;
    this.stateMachines = stateMachines;
  }

  handle(event, currentState : string) : string {
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

    const stateMachine = this.stateMachines.get(currentPeriod);

    if (stateMachine) {
      return stateMachine;
    } else {
      Logger.error('NextProgrammeChooser.chooseStateMachine: Unknown time');

      return this.stateMachines.get('morning');
    }
  }
}

export default NextProgrammeChooser;
