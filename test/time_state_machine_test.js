'use strict';

const assert = require('assert');
const TimeStateMachine = require('../time_state_machine');

let subject = null;

describe('TimeStateMachine', function () {
  beforeEach(function () {
    subject = new TimeStateMachine({
      on: {
        morning: 'afternoon',
        default: 'evening'
      },
      off: {
        default: 'mostlyOff',
        mostlyOff: 'off'
      }
    });
  });

  context('when the transition is configured', function () {
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

  context('when the transition is not configured', function () {
    it('follows the default', function () {
      const state = subject.handle('on', 'something');

      assert.equal(state, 'evening');
    });
  });

  context('when the event is not configured', function () {
    it('does not do anything', function () {
      const state = subject.handle('something', 'afternoon');

      assert.equal(state, 'afternoon');
    });
  });
});
