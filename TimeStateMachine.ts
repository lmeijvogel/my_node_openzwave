import { Logger } from "./Logger";
import { SwitchPressName } from "./SwitchPressName";

interface ITimeStateMachine {
  handle(switchPressName: SwitchPressName, currentState): string;
  defaultState(): string;
}

class TimeStateMachine implements ITimeStateMachine {
  transitions: Map<SwitchPressName, Map<string, string>>;

  constructor(transitions: Map<SwitchPressName, Map<string, string>>) {
    Logger.debug(
      `TimeStateMachine.constructor: Building TimeStateMachine with transitions: ${JSON.stringify([...transitions])}`
    );
    this.transitions = transitions;

    if (!this.transitions.has(SwitchPressName.SingleOff)) {
      Logger.info('TimeStateMachine.constructor: Adding default "off" constructor');
      this.transitions.set(SwitchPressName.SingleOff, new Map<string, string>([["default", "off"]]));
    }
  }

  handle(switchPressName: SwitchPressName, currentState: string): string {
    Logger.debug(`TimeStateMachine.handle: Handling event: ${switchPressName}`);
    Logger.debug(`TimeStateMachine.handle: Current state: ${JSON.stringify(currentState)}`);

    const currentTransitions: Map<string, string> | undefined = this.transitions.get(switchPressName);

    if (!currentTransitions) {
      Logger.warn(`No transition from "${currentState}" for event "${switchPressName}"`);
      return currentState;
    }

    Logger.debug(`TimeStateMachine.handle: Transition table: ${JSON.stringify([...currentTransitions])}`);

    const transitionFromTable = currentTransitions.get(currentState);

    if (transitionFromTable) {
      Logger.info(`TimeStateMachine.handle: Found transition: ${transitionFromTable}`);

      return transitionFromTable;
    } else {
      const defaultTransition = currentTransitions.get("default");

      if (!defaultTransition) {
        Logger.error("TimeStateMachine.handle: No default transition found!");

        throw "No default transition exists!";
      }

      Logger.info(`TimeStateMachine.handle: No transition found, using default: ${defaultTransition}`);

      return defaultTransition;
    }
  }

  defaultState(): string | null {
    const currentTransitions: Map<string, string> | undefined = this.transitions.get(SwitchPressName.SingleOn);

    if (!currentTransitions) {
      Logger.warn("No default transition found");
      return null;
    }

    return currentTransitions.get("default");

  }

  _getTransitions() {
    return this.transitions;
  }
}

export { TimeStateMachine };
export { ITimeStateMachine };
