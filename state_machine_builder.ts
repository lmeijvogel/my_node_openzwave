import { chain, forIn } from 'lodash';
import TimeStateMachine from './time_state_machine';
import Programme from './programme';

class StateMachineBuilder {
  transitionsConfiguration: any;
  existingProgrammes: Programme[];

  constructor(transitionsConfiguration, existingProgrammes) {
    this.transitionsConfiguration = transitionsConfiguration;
    this.existingProgrammes = existingProgrammes;
  }

  call() {
    this.checkConfiguration(this.transitionsConfiguration, this.existingProgrammes);

    return chain(this.transitionsConfiguration).keys().reduce((acc, period) => {
      acc[period] = new TimeStateMachine(this.transitionsConfiguration[period]);
      return acc;
    }, {}).value();
  }

  checkConfiguration(transitionsConfiguration, existingProgrammes) {
    if (!existingProgrammes.off) {
      throw 'A programme named \'off\' should be defined!';
    }

    forIn(transitionsConfiguration, (transitionsPerSwitch, period) => {
      forIn(transitionsPerSwitch, (transitions, onOrOff) => {
        forIn(transitions, (to, from) => {
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

export default StateMachineBuilder;
