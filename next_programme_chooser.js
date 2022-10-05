'use strict';

const Logger = require('./logger');

function NextProgrammeChooser(timeService, stateMachines) {
  function handle(event, currentState) {
    Logger.debug('NextProgrammeChooser.handle: currentState: ', currentState);

    const currentStateMachine = chooseStateMachine();

    const newState = currentStateMachine.handle(event, currentState);

    Logger.verbose('NextProgrammeChooser.handle: new currentState: ', newState);

    return newState;
  }

  function chooseStateMachine() {
    const now = new Date();

    const currentPeriod = timeService.getPeriod(now);

    Logger.debug('NextProgrammeChooser.chooseStateMachine: Time is ', now);
    Logger.debug('NextProgrammeChooser.chooseStateMachine: currentPeriod is ', currentPeriod);

    const stateMachine = stateMachines[currentPeriod];

    if (stateMachine) {
      return stateMachine;
    } else {
      Logger.error('NextProgrammeChooser.chooseStateMachine: Unknown time');
      return stateMachines.morning;
    }
  }

  return {
    handle: handle,
    chooseStateMachine: chooseStateMachine
  };
}

module.exports = NextProgrammeChooser;
