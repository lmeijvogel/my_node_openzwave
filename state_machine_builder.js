'use strict';

const _ = require('lodash');
const TimeStateMachine = require('./time_state_machine');

function StateMachineBuilder(config) {
  function call() {
    let result = {};

    _(_.keys(config.transitions)).each(function (period) {
      result[period] = new TimeStateMachine(config.transitions[period]);
    });

    return result;
  }

  return {
    call: call
  };
}

module.exports = StateMachineBuilder;
