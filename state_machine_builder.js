'use strict';

const _ = require('lodash');
const TimeStateMachine = require('./time_state_machine');

function StateMachineBuilder(transitionsConfiguration, existingProgrammes) {
  function call() {
    checkConfiguration(transitionsConfiguration, existingProgrammes);

    return _(transitionsConfiguration).keys().reduce(function (acc, period) {
      acc[period] = new TimeStateMachine(transitionsConfiguration[period]);
      return acc;
    }, {});
  }

  function checkConfiguration(transitionsConfiguration, existingProgrammes) {
    if (!existingProgrammes.off) {
      throw 'A programme named \'off\' should be defined!';
    }

    _.forIn(transitionsConfiguration, function (transitionsPerSwitch, period) {
      _.forIn(transitionsPerSwitch, function (transitions, onOrOff) {
        _.forIn(transitions, function (to, from) {
          if (!existingProgrammes[to]) {
            throw 'Error creating transition \'' + period + '\':' +
            '\'' + onOrOff + '\', end programme \'' + to + '\' not found.';
          }
          if (from !== 'default' && !existingProgrammes[from]) {
            throw 'Error creating transition \'' + period + '\':' +
            '\'' + onOrOff + '\', start programme \'' + from + '\' not found.';
          }
        });
      });
    });
  }

  return {
    call: call
  };
}

module.exports = StateMachineBuilder;
