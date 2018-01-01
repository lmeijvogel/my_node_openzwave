'use strict';

const _ = require('lodash');
const Logger = require('./logger');

class TimeStateMachine {
  constructor(transitions) {
    this.transitions = _.defaults({}, transitions, {
      off: {
        default: 'off'
      }
    });
  }

  handle(event, currentState) {
    Logger.debug('TimeStateMachine.handle: Handling event: ', event);
    Logger.debug('TimeStateMachine.handle: Current state: ', currentState);

    const currentTransitions = this.transitions[event];

    Logger.debug('TimeStateMachine.handle: Transition table: ', currentTransitions);

    if (!currentTransitions) {
      Logger.warn('No transition from "', currentState, '" for event "', event, '"');
      return currentState;
    }

    const transitionFromTable = currentTransitions[currentState];

    if (transitionFromTable) {
      Logger.info('TimeStateMachine.handle: Found transition:', transitionFromTable);

      return transitionFromTable;
    } else {
      const defaultTransition = currentTransitions['default'];

      Logger.info('TimeStateMachine.handle: No transition found, using default: ', defaultTransition);

      return defaultTransition;
    }
  }

  _getTransitions() {
    return this.transitions;
  }
}

module.exports = TimeStateMachine;
