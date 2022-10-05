'use strict';

const _ = require('lodash');
const TimeStateMachine = require('./time_state_machine');

function StateMachineBuilder(transitionsConfiguration) {
  function call() {
    return _(transitionsConfiguration).keys().reduce(function (acc, period) {
      acc[period] = new TimeStateMachine(transitionsConfiguration[period]);
      return acc;
    }, {});
  }

  return {
    call: call
  };
}

module.exports = StateMachineBuilder;
