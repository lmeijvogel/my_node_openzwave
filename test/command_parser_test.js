'use strict';
const _ = require('lodash');
const assert = require('assert');
const RedisCommandParser = require('../redis_command_parser');

const stub = (result) => function () { return result; };

let subject = null;

describe('RedisCommandParser', function () {
  beforeEach(function () {
    subject = new RedisCommandParser({regular: {}});
  });

  describe('parse', function () {
    context('when the command cannot be parsed', function () {
      it('does not call programmeSelected callbacks', function () {
        subject.on('programmeChosen', function (programmeName) {
          assert.fail('programmeChosen callback should have not been called');
        });

        subject.parse('something something');
      });
    });

    context('when a programme is selected', function () {
      it('calls the given block with the given programme name', function () {
        let callbackCalled = false;

        subject.on('programmeChosen', function (programmeName) {
          callbackCalled = true;
          assert.equal(programmeName, 'regular');
        });

        subject.parse('programme regular');

        assert.equal(callbackCalled, true, 'programmeChosen callback should have been called');
      });
    });

    context('when network neighbors are requested', function () {
      it('calls the given block with the nodeid', function () {
        let callbackCalled = false;

        subject.on('neighborsRequested', function (nodeid) {
          callbackCalled = true;
          assert.equal(nodeid, 1);
        });

        subject.parse('neighbors 1');

        assert.equal(callbackCalled, true, 'neighborsRequested callback should have been called');
      });
    });

    context('when a network heal is requested', function () {
      it('calls the given block', function () {
        let callbackCalled = false;

        subject.on('healNetworkRequested', function () {
          callbackCalled = true;
        });

        subject.parse('healNetwork');

        assert.equal(callbackCalled, true, 'healNetworkRequested callback should have been called');
      });
    });
  });
});
