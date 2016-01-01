'use strict';

var Logger = require('./logger');

function NextProgrammeChooser(timeService, stateMachines) {
  var currentState = null;

  function setCurrentState(newCurrentState) {
    Logger.debug('NextProgrammeChooser: Registering current state as', currentState);
    currentState = newCurrentState;
  }

  function handle(event) {
    Logger.debug('Leaving state', currentState);

    var currentStateMachine = chooseStateMachine();

    currentState = currentStateMachine.handle(event);

    Logger.verbose('Entering state', currentState);

    return currentState;
  }

  function chooseStateMachine() {
    var now = new Date();
    var currentPeriod = timeService.getPeriod(now);

    var stateMachine = stateMachines[currentPeriod];

    if (stateMachine) {
      return stateMachine;
    } else {
      Logger.error('NextProgrammeChooser#chooseStateMachine: Unknown time');
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
