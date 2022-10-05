import * as assert from "assert";
import { NextProgrammeChooser } from "../NextProgrammeChooser";
import { SwitchPressName } from "../SwitchPressName";
import { ITimeStateMachine } from "../TimeStateMachine";
import { MockTimeService } from "./MockTimeService";

let stateMachines: Map<string, ITimeStateMachine>;

const timeService = new MockTimeService("", new Date());

let subject: NextProgrammeChooser;

class MockTimeStateMachine {
  currentStateIndex = 0;

  constructor(private readonly states: string[]) { }

  handle(_event, _currentState) {
    const result = this.states[this.currentStateIndex];
    this.currentStateIndex++;

    return result
  }

  defaultState(): string {
    return this.states[0];
  }
}

describe('NextProgrammeChooser', () => {
  beforeEach(() => {
    const stateTransitions = new Map<string, Map<string, string>>();

    stateMachines = buildStateMachines(stateTransitions, stateTransitions, stateTransitions);

    subject = new NextProgrammeChooser(timeService, stateMachines);
  });

  describe('chooseStateMachine', () => {
    ['morning' , 'evening' , 'night'].forEach(period => {
      describe(`when it is ${period}`, () => {
        beforeEach(() => {
          timeService.getPeriod = () => { return period; };
        });

        it('sets the correct state machine', () => {
          const result = subject.chooseStateMachine();

          assert.equal(result, stateMachines.get(period));
        });
      });
    });

    // This should of course never happen, but it's nice
    // to know that at least some lights will always turn on.
    describe('when the time is unknown', () => {
      beforeEach(() => {
        timeService.getPeriod = () =>  "some_unknown_period";
      });

      it('defaults to "morning"', () => {
        const result = subject.chooseStateMachine();

        assert.equal(result, stateMachines.get('morning'));
      });
    });
  });

  describe('handle', () => {
    describe('the result', () => {
      it('returns the chosen state', () => {
        const timeService = new MockTimeService('morning', new Date());

        const morningStateMachine = new MockTimeStateMachine(['dimmed', 'morning']);
        const otherStateMachine = new MockTimeStateMachine(['should not get here']);

        const stateMachines = buildStateMachines(morningStateMachine, otherStateMachine, otherStateMachine);

        subject = new NextProgrammeChooser(timeService, stateMachines);

        let result = subject.handle(SwitchPressName.SingleOn, null);

        assert.equal(result, 'dimmed');

        result = subject.handle(SwitchPressName.SingleOn, null);

        assert.equal(result, 'morning');
      });
    });
  });

  describe('handleAuxPress', () => {
    describe('the result', () => {
      it('returns the chosen state', () => {
        const timeService = new MockTimeService('morning', new Date());

        const morningStateMachine = new MockTimeStateMachine(['dimmed', 'morning']);
        const otherStateMachine = new MockTimeStateMachine(['should not get here']);

        const stateMachines = buildStateMachines(morningStateMachine, otherStateMachine, otherStateMachine);

        subject = new NextProgrammeChooser(timeService, stateMachines);

        // Note that the subject does not keep state:
        // These next assertions are independent of each other
        let result = subject.handleAuxPress(null);
        assert.equal(result, 'dimmed');

        result = subject.handleAuxPress('morning');
        assert.equal(result, 'dimmed');

        result = subject.handleAuxPress('dimmed');
        assert.equal(result, 'off');

        result = subject.handleAuxPress('off');
        assert.equal(result, 'dimmed');
      });
    });
});

function buildStateMachines(morningStateMachine, eveningStateMachine, nightStateMachine) {
  const stateMachines = new Map<string, ITimeStateMachine>();

  stateMachines.set('morning', morningStateMachine);
  stateMachines.set('evening', eveningStateMachine);
  stateMachines.set('night', nightStateMachine);

  return stateMachines;
}
