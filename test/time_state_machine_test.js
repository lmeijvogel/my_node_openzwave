'use strict';

const assert = require('assert');
const TimeStateMachine = require('../time_state_machine');

let subject = null;

describe('TimeStateMachine', function () {
  beforeEach(function () {
    subject = TimeStateMachine({
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
    beforeEach(function () {
      subject.setState('morning');
    });

    it('follows it', function () {
      subject.handle('on');
      assert.equal(subject.getState(), 'afternoon');
    });

    it('even works on the off switch', function () {
      subject.handle('off');
      assert.equal(subject.getState(), 'mostlyOff');

      subject.handle('off');
      assert.equal(subject.getState(), 'off');
    });
  });

  context('when the transition is not configured', function () {
    beforeEach(function () {
      subject.setState('something');
    });

    it('follows the default', function () {
      subject.handle('on');
      assert.equal(subject.getState(), 'evening');
    });
  });

  context('when the event is not configured', function () {
    beforeEach(function () {
      subject.setState('afternoon');
    });

    it('does not do anything', function () {
      subject.handle('something');
      assert.equal(subject.getState(), 'afternoon');
    });
  });
});
