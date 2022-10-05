'use strict';

const Logger = require('./logger');

function NextProgrammeChooser(timeService, stateMachines) {
  let currentState = null;

  function setCurrentState(newCurrentState) {
    Logger.debug('NextProgrammeChooser: Registering current state as', newCurrentState);
    currentState = newCurrentState;
  }

  function handle(event) {
    Logger.debug('NextProgrammeChooser.handle: currentState: ', currentState);

    const currentStateMachine = chooseStateMachine();

    currentState = currentStateMachine.handle(event);

    Logger.verbose('NextProgrammeChooser.handle: new currentState: ', currentState);

    return currentState;
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
    chooseStateMachine: chooseStateMachine,
    setCurrentState: setCurrentState
  };
}

module.exports = NextProgrammeChooser;
