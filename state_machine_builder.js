'use strict';

const _ = require('lodash');
const TimeStateMachine = require('./time_state_machine');

class StateMachineBuilder {
  constructor(transitionsConfiguration, existingProgrammes) {
    this.transitionsConfiguration = transitionsConfiguration;
    this.existingProgrammes = existingProgrammes;
  }

  call() {
    this.checkConfiguration(this.transitionsConfiguration, this.existingProgrammes);

    return _(this.transitionsConfiguration).keys().reduce((acc, period) => {
      acc[period] = new TimeStateMachine(this.transitionsConfiguration[period]);
      return acc;
    }, {});
  }

  checkConfiguration(transitionsConfiguration, existingProgrammes) {
    if (!existingProgrammes.off) {
      throw 'A programme named \'off\' should be defined!';
    }

    _.forIn(transitionsConfiguration, (transitionsPerSwitch, period) => {
      _.forIn(transitionsPerSwitch, (transitions, onOrOff) => {
        _.forIn(transitions, (to, from) => {
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
}

module.exports = StateMachineBuilder;
