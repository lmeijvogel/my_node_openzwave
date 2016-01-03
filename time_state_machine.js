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
    const currentTransitions = transitions[event];

    // Missing 'on' somewhere in the chain

    if (!currentTransitions) {
      Logger.warn('No transition from "', state, '" for event "', event, '"');
      return;
    }

    const newState = currentTransitions[state] || currentTransitions['default'];

    Logger.info('Transition to state ', newState);
    setState(newState);
    return newState;
  }

  function getState() {
    return state;
  }

  function setState(newState) {
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
