import { keys, find, forOwn, toPairs } from "lodash";
import { Configuration } from "./Configuration";
import { Logger } from "./Logger";
import { SwitchPressName } from "./SwitchPressName";
import { TimeStateMachine } from "./TimeStateMachine";
import { IProgramme } from "./Programme";

import { TimePeriod } from "./TimeService";

type TransitionsConfig = {[key: string]: string};

type Transitions = Map<string, string>;

class StateMachineBuilder {
  constructor(private config: Pick<Configuration, "programmes" | "transitions">) {
    Logger.debug(
      `StateMachineBuilder.constructor: transitionsConfiguration: ${JSON.stringify(config.transitions)}`
    );
    Logger.debug(`StateMachineBuilder.constructor: programmes: ${config.programmes}`);
  }

  recheckConfiguration() {
      this.checkConfiguration();
  }

  call(): Map<TimePeriod, TimeStateMachine> {
    this.checkConfiguration();

    const result = new Map<TimePeriod, TimeStateMachine>();

    keys(this.config.transitions).forEach(period => {
      const value: object = this.config.transitions[period];

      result.set(period, new TimeStateMachine(this.toNestedMap(value)));
    });

    return result;
  }

  private checkConfiguration() {
    if (!this.programmeWithName("off")) {
      throw new Error("A programme named 'off' should be defined!");
    }

    forOwn(this.config.transitions, (transitionsPerSwitch, period) => {
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

  private toNestedMap(input: any): Map<SwitchPressName, Transitions> {
    let result = new Map<SwitchPressName, Transitions>();

    forOwn(input, (transitionsInput: TransitionsConfig, switchPressName: string) => {
      let transitions: Transitions = new Map(toPairs(transitionsInput));

      result.set(switchPressName as SwitchPressName, transitions);
    });

    return result;
  }

  private programmeWithName(name: String): IProgramme | undefined {
    Logger.debug(`StateMachineBuilder.programmeWithName: Finding programme ${name} in ${this.config.programmes}`);
    const result = find(this.config.programmes, programme => programme.name === name);

    return result;
  }
}

export { StateMachineBuilder };
