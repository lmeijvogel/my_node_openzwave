import { Logger } from "./Logger";
import { SwitchPressName } from "./SwitchPressName";

interface ITimeStateMachine {
    handle(switchPressName: SwitchPressName, currentState: string | null): string | null;
    defaultState(): string | null;
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

    handle(switchPressName: SwitchPressName, currentState: string | null): string | null {
        Logger.debug(`TimeStateMachine.handle: Handling event: ${switchPressName}`);
        Logger.debug(`TimeStateMachine.handle: Current state: ${JSON.stringify(currentState)}`);

        const currentTransitions = this.transitions.get(switchPressName);

        if (!currentTransitions) {
            Logger.warn(`No transition from "${currentState}" for event "${switchPressName}"`);
            return currentState;
        }

        Logger.debug(`TimeStateMachine.handle: Transition table: ${JSON.stringify([...currentTransitions])}`);

        if (!currentState) {
            return this.getDefaultTransition(currentTransitions);
        }

        const transitionFromTable = currentTransitions.get(currentState);

        if (transitionFromTable) {
            Logger.info(`TimeStateMachine.handle: Found transition: ${transitionFromTable}`);

            return transitionFromTable;
        } else {
            return this.getDefaultTransition(currentTransitions);
        }
    }

    // TODO: Rename to something like defaultOnState
    defaultState(): string | null {
        const currentTransitions = this.transitions.get(SwitchPressName.SingleOn);

        if (!currentTransitions) {
            Logger.warn("No default transition found");
            return null;
        }

        return currentTransitions.get("default") || null;
    }

    getDefaultTransition(currentTransitions: Map<string, string>): string {
        const defaultTransition = currentTransitions.get("default");

        if (!defaultTransition) {
            Logger.error("TimeStateMachine.handle: No default transition found!");

            throw "No default transition exists!";
        }

        Logger.info(`TimeStateMachine.handle: No transition found, using default: ${defaultTransition}`);

        return defaultTransition;
    }

    _getTransitions() {
        return this.transitions;
    }
}

export { TimeStateMachine };
export { ITimeStateMachine };
