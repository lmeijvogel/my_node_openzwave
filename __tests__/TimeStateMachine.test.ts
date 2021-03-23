import * as assert from 'assert';
import { SwitchPressName } from '../SwitchPressName';
import { TimeStateMachine } from '../TimeStateMachine';

let subject = new TimeStateMachine(new Map<SwitchPressName, Map<string, string>>());

let onTransitions = new Map<string, string>();
onTransitions.set('morning', 'afternoon');
onTransitions.set('default', 'evening');

let offTransitions = new Map<string, string>();
offTransitions.set('default', 'mostlyOff');
offTransitions.set('mostlyOff', 'off');

let transitions : Map<SwitchPressName, Map<string, string>> = new Map()
transitions.set(SwitchPressName.SingleOn, onTransitions);
transitions.set(SwitchPressName.SingleOff, offTransitions);

describe('TimeStateMachine', function () {
  beforeEach(function () {
    subject = new TimeStateMachine(transitions);
  });

  describe('when the transition is configured', function () {
    it('follows it', function () {
      const state = subject.handle(SwitchPressName.SingleOn, 'morning');

      assert.equal(state, 'afternoon');
    });

    it('even works on the off switch', function () {
      const state = subject.handle(SwitchPressName.SingleOff, 'morning');

      assert.equal(state, 'mostlyOff');

      const nextState = subject.handle(SwitchPressName.SingleOff, state);

      assert.equal(nextState, 'off');
    });
  });

  describe('when the transition is not configured', function () {
    it('follows the default', function () {
      const state = subject.handle(SwitchPressName.SingleOn, 'something');

      assert.equal(state, 'evening');
    });
  });

  describe('when the event is not configured', function () {
    it('does not do anything', function () {
      const state = subject.handle(SwitchPressName.HoldOn, 'afternoon');

      assert.equal(state, 'afternoon');
    });
  });
});
