'use strict';

const _ = require('lodash');
const assert = require('assert');
const NextProgrammeChooser = require('../next_programme_chooser');

const stub = (result) => function () { return result; };

let stateMachines = null;
let timeService = null;
let subject = null;

describe('NextProgrammeChooser', function () {
  beforeEach(function () {
    stateMachines = {
      morning: {handle: function () {}},
      evening: {handle: function () {}},
      night:   {handle: function () {}}
    };

    timeService = {};

    subject = new NextProgrammeChooser(timeService, stateMachines);
  });

  describe('chooseStateMachine', function () {
    _(['morning' , 'evening' , 'night']).each(function (period) {
      context('when it is ' + period, function () {
        beforeEach(function () {
          timeService.getPeriod = function () { return period; };
        });

        it('sets the correct state machine', function () {
          const result = subject.chooseStateMachine();

          assert.equal(result, stateMachines[period]);
        });
      });
    });

    // This should of course never happen, but it's nice
    // to know that at least some lights will always turn on.
    context('when the time is unknown', function () {
      beforeEach(function () {
        timeService.getPeriod = function () { return undefined; };
      });

      it('default to "morning"', function () {
        const result = subject.chooseStateMachine();

        assert.equal(result, stateMachines.morning);
      });
    });
  });

  describe('handle', function () {
    describe('the result', function () {
      it('returns the chosen state', function () {
        timeService.getPeriod = function () { return 'morning'; };

        stateMachines['morning'] = {
          handle: function () { return 'dimmed'; }
        };

        subject = new NextProgrammeChooser(timeService, stateMachines);

        const result = subject.handle('on');

        assert.equal(result, 'dimmed');
      });
    });
  });
});
