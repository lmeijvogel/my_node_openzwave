import { Logger } from './logger';

interface ITimeStateMachine {
  handle(event, currentState) : string;
}

class TimeStateMachine implements ITimeStateMachine {
  transitions : Map<string, Map<string, string>>;

  constructor(transitions : Map<string, Map<string, string>>) {
    Logger.debug("TimeStateMachine.constructor: Building TimeStateMachine with transitions:", JSON.stringify([...transitions]));
    this.transitions = transitions;

    if (!this.transitions.has('off')) {
      Logger.info('TimeStateMachine.constructor: Adding default "off" constructor');
      this.transitions.set('off', new Map<string, string>([['default', 'off']]));
    }
  }

  // event: 'on' | 'off'
  handle(event : string, currentState : string) : string {
    Logger.debug('TimeStateMachine.handle: Handling event:', event);
    Logger.debug('TimeStateMachine.handle: Current state:', JSON.stringify(currentState));

    const currentTransitions : Map<string, string>|undefined = this.transitions.get(event);

    if (!currentTransitions) {
      Logger.warn('No transition from "', currentState, '" for event "', event, '"');
      return currentState;
    }

    Logger.debug('TimeStateMachine.handle: Transition table:', JSON.stringify([...currentTransitions]));

    const transitionFromTable = currentTransitions.get(currentState);

    if (transitionFromTable) {
      Logger.info('TimeStateMachine.handle: Found transition:', transitionFromTable);

      return transitionFromTable;
    } else {
      const defaultTransition = currentTransitions.get('default');

      if (!defaultTransition) {
        Logger.error('TimeStateMachine.handle: No default transition found!');

        throw "No default transition exists!";
      }

      Logger.info('TimeStateMachine.handle: No transition found, using default:', defaultTransition);

      return defaultTransition;
    }
  }

  _getTransitions() {
    return this.transitions;
  }
}

export { TimeStateMachine };
export { ITimeStateMachine };
