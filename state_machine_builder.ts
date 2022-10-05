import { keys, find, forIn } from 'lodash';
import TimeStateMachine from './time_state_machine';
import Programme from './programme';

class StateMachineBuilder {
  private readonly transitionsConfiguration: object;
  private readonly existingProgrammes: Programme[];

  constructor(transitionsConfiguration : object, existingProgrammes) {
    this.transitionsConfiguration = transitionsConfiguration;
    this.existingProgrammes = existingProgrammes;
  }

  call() : Map<string, TimeStateMachine> {
    this.checkConfiguration();

    const result = new Map<string, TimeStateMachine>();

    keys(this.transitionsConfiguration).forEach((period) => {
      const value = this.transitionsConfiguration[period];

      result.set(period, new TimeStateMachine(this.transitionsConfiguration[value]));
    });

    return result;
  }

  checkConfiguration() {
    if (!this.programmeWithName('off')) {
      throw 'A programme named \'off\' should be defined!';
    }

    forIn(this.transitionsConfiguration, (transitionsPerSwitch, period) => {
      forIn(transitionsPerSwitch, (transitions, onOrOff) => {
        forIn(transitions, (to, from) => {
          if (!this.programmeWithName(to)) {
            throw 'Error creating transition \'' + period + '\':' +
            '\'' + onOrOff + '\', end programme \'' + to + '\' not found.';
          }
          if (from !== 'default' && !this.programmeWithName(from)) {
            throw 'Error creating transition \'' + period + '\':' +
            '\'' + onOrOff + '\', start programme \'' + from + '\' not found.';
          }
        });
      });
    });
  }

  programmeWithName(name : String) : Programme {
    return find(this.existingProgrammes, programme => programme.name === 'off');
  }
}

export default StateMachineBuilder;
