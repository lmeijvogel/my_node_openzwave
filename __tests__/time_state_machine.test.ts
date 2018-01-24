import * as assert from 'assert';
import { TimeStateMachine } from '../time_state_machine';
import * as jest from 'ts-jest';

let subject = new TimeStateMachine(new Map<string, Map<string, string>>());

let onTransitions = new Map<string, string>();
onTransitions.set('morning', 'afternoon');
onTransitions.set('default', 'evening');

let offTransitions = new Map<string, string>();
offTransitions.set('default', 'mostlyOff');
offTransitions.set('mostlyOff', 'off');

let transitions : Map<string, Map<string, string>> = new Map()
transitions.set('on', onTransitions);
transitions.set('off', offTransitions);

describe('TimeStateMachine', function () {
  beforeEach(function () {
    subject = new TimeStateMachine(transitions);
  });

  describe('when the transition is configured', function () {
    it('follows it', function () {
      const state = subject.handle('on', 'morning');

      assert.equal(state, 'afternoon');
    });

    it('even works on the off switch', function () {
      const state = subject.handle('off', 'morning');

      assert.equal(state, 'mostlyOff');

      const nextState = subject.handle('off', state);

      assert.equal(nextState, 'off');
    });
  });

  describe('when the transition is not configured', function () {
    it('follows the default', function () {
      const state = subject.handle('on', 'something');

      assert.equal(state, 'evening');
    });
  });

  describe('when the event is not configured', function () {
    it('does not do anything', function () {
      const state = subject.handle('something', 'afternoon');

      assert.equal(state, 'afternoon');
    });
  });
});
