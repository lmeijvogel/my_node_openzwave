'use strict';

const _ = require('lodash');
const TimeStateMachine = require('./time_state_machine');

function StateMachineBuilder(config) {
  function call() {
    return _(config.transitions).keys().reduce(function (acc, period) {
      acc[period] = new TimeStateMachine(config.transitions[period]);
      return acc;
    }, {});
  }

  return {
    call: call
  };
}

module.exports = StateMachineBuilder;
