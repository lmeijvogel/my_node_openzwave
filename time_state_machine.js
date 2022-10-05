"use strict";

var _ = require('lodash');
var Logger = require('./logger');

function TimeStateMachine(transitions) {
  var state = null;

  transitions = _.defaults({}, transitions, {
    off: {
      default: "off"
    }
  });

  function handle(event) {
    var currentTransitions = transitions[event];

    // Missing 'on' somewhere in the chain

    if (!currentTransitions) {
      Logger.warn("No transition from '", state, "' for event '", event, "'");
      return;
    }

    var newState = currentTransitions[state];

    if (!newState) {
      newState = currentTransitions["default"];
    }

    Logger.info("Transition to state ", newState);
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
