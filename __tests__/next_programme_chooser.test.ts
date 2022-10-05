import * as _ from 'lodash';
import * as assert from 'assert';
import NextProgrammeChooser from '../next_programme_chooser';
import { ITimeStateMachine } from '../time_state_machine';
import MockTimeService from './mock_time_service';

const stub = (result) => function () { return result; };

let stateMachines = new Map<string, ITimeStateMachine>();

let timeService = new MockTimeService("", new Date());
//{ getPeriod: () => "", currentTime: () => new Date() };
let subject = { chooseStateMachine: () => {}, handle: (evt, currentState) => ''};

class MockTimeStateMachine {
  private readonly newState : string;

  constructor(newState) {
    this.newState = newState;
  }
  handle(event, currentState) {
    return this.newState;
  }
}

describe('NextProgrammeChooser', function () {
  beforeEach(function () {
    const stateTransitions = new Map<string, Map<string, string>>();

    stateMachines = buildStateMachines(stateTransitions, stateTransitions, stateTransitions);

    subject = new NextProgrammeChooser(timeService, stateMachines);
  });

  describe('chooseStateMachine', function () {
    _(['morning' , 'evening' , 'night']).each(function (period) {
      describe('when it is ' + period, function () {
        beforeEach(function () {
          timeService.getPeriod = function () { return period; };
        });

        it('sets the correct state machine', function () {
          const result = subject.chooseStateMachine();

          assert.equal(result, stateMachines.get(period));
        });
      });
    });

    // This should of course never happen, but it's nice
    // to know that at least some lights will always turn on.
    describe('when the time is unknown', function () {
      beforeEach(function () {
        timeService.getPeriod = function () { return "some_unknown_period"; };
      });

      it('default to "morning"', function () {
        const result = subject.chooseStateMachine();

        assert.equal(result, stateMachines.get('morning'));
      });
    });
  });

  describe('handle', function () {
    describe('the result', function () {
      it('returns the chosen state', function () {
        const timeService = new MockTimeService('morning', new Date());

        const morningStateMachine = new MockTimeStateMachine('dimmed');
        const otherStateMachine = new MockTimeStateMachine('should not get here');

        const stateMachines = buildStateMachines(morningStateMachine, otherStateMachine, otherStateMachine);

        subject = new NextProgrammeChooser(timeService, stateMachines);

        const result = subject.handle('on', null);

        assert.equal(result, 'dimmed');
      });
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
