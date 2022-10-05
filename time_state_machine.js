'use strict';

const _ = require('lodash');
const Logger = require('./logger');

function TimeStateMachine(transitions) {
  let state = null;

  transitions = _.defaults({}, transitions, {
    off: {
      default: 'off'
    }
  });

  function handle(event) {
    Logger.debug('TimeStateMachine.handle: Handling event: ', event);
    Logger.debug('TimeStateMachine.handle: Current state: ', state);

    const currentTransitions = transitions[event];

    Logger.debug('TimeStateMachine.handle: Transition table: ', currentTransitions);

    // Missing 'on' somewhere in the chain

    if (!currentTransitions) {
      Logger.warn('No transition from "', state, '" for event "', event, '"');
      return;
    }

    let newState = null;

    const transitionFromTable = currentTransitions[state];

    if (transitionFromTable) {
      Logger.debug('TimeStateMachine.handle: Found transition: ', JSON.stringify(transitionFromTable));

      newState = transitionFromTable;
    } else {
      const defaultTransition = currentTransitions['default'];

      Logger.debug('TimeStateMachine.handle: No transition found, using default: ', defaultTransition);

      newState = defaultTransition;
    }

    Logger.info('Transition to state ', newState);
    setState(newState);
    return newState;
  }

  function getState() {
    return state;
  }

  function setState(newState) {
    Logger.debug('TimeStateMachine.setState: newState: ', newState);
    state = newState;
  }

  function getTransitions() {
    return transitions;
  }

  return {
    getState: getState,
    handle: handle,
    setState: setState,
    _getTransitions: getTransitions
  };
}

module.exports = TimeStateMachine;
