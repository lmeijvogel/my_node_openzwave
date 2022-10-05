import { keys, find, forOwn, toPairs } from "lodash";
import { Configuration } from "./Configuration";
import { Logger } from "./Logger";
import { SwitchPressName } from "./SwitchPressName";
import { TimeStateMachine } from "./TimeStateMachine";
import { IProgramme } from "./Programme";

import { TimePeriod } from "./TimeService";

type Transitions = Map<string, string>;

class StateMachineBuilder {
  private readonly transitionsConfiguration: object;
  private readonly programmes: IProgramme[];

  constructor(config: Configuration) {
    this.transitionsConfiguration = config.transitions;
    Logger.debug(
      `StateMachineBuilder.constructor: transitionsConfiguration: ${JSON.stringify(transitionsConfiguration)}`
    );
    this.programmes = config.programmes;
    Logger.debug(`StateMachineBuilder.constructor: programmes: ${this.programmes}`);
  }

  call(): Map<TimePeriod, TimeStateMachine> {
    this.checkConfiguration();

    const result = new Map<TimePeriod, TimeStateMachine>();

    keys(this.transitionsConfiguration).forEach(period => {
      const value: object = this.transitionsConfiguration[period];

      result.set(period, new TimeStateMachine(this.toNestedMap(value)));
    });

    return result;
  }

  private checkConfiguration() {
    if (!this.programmeWithName("off")) {
      throw new Error("A programme named 'off' should be defined!");
    }

    forOwn(this.transitionsConfiguration, (transitionsPerSwitch, period) => {
      forOwn(transitionsPerSwitch, (transitions, onOrOff) => {
        forOwn(transitions, (to, from) => {
          Logger.debug(`Checking transition "${from}" => "${to}"`);
          if (!this.programmeWithName(to)) {
            const errorMessage = `Error creating transition '${period}': '${onOrOff}', end programme '${to}' not found.`;

            throw new Error(errorMessage);
          }
          Logger.debug(`will check ${from}`);
          if (from !== "default" && !this.programmeWithName(from)) {
            const errorMessage = `Error creating transition '${period}': '${onOrOff}', start programme '${from}' not found.`;

            throw new Error(errorMessage);
          }
        });
      });
    });
  }

  private toNestedMap(input): Map<SwitchPressName, Transitions> {
    let result = new Map<SwitchPressName, Transitions>();

    forOwn(input, (transitionsInput, switchPressName: SwitchPressName) => {
      let transitions: Transitions = new Map(toPairs(transitionsInput));

      result.set(switchPressName, transitions);
    });

    return result;
  }

  private programmeWithName(name: String): IProgramme | undefined {
    Logger.debug(`StateMachineBuilder.programmeWithName: Finding programme ${name} in ${this.programmes}`);
    const result = find(this.programmes, programme => programme.name === name);

    return result;
  }
}

export { StateMachineBuilder };
