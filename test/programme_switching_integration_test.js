'use strict';

const assert               = require('assert');
const Node                 = require('../node');
const _                    = require('lodash');

const NextProgrammeChooser = require('../next_programme_chooser');
const TimeStateMachine     = require('../time_state_machine');
const EventProcessor       = require('../event_processor');

describe('integration', function () {
  let handler;

  const myZWave = {
    onNodeEvent: function (h) { handler = h; }
  };

  const timeService = {
    getPeriod: function () { return 'evening'; }
  };

  const switchOff = function () {
    handler.call(myZWave, Node(3), 0);
  };

  const switchOn  = function () {
    handler.call(myZWave, Node(3), 255);
  };

  const stateMachines = {
    evening: TimeStateMachine({
      on: {
        evening: 'dimmed',
        default: 'evening'
      },

      off: {
        default: 'off'
      }
    })
  };

  let programme;
  let programmes = {};

  _(['evening', 'tree', 'dimmed', 'off']).each(function (name) {
    programmes[name] = {
      name:  name,
      apply: function () {
        programme = name;
      }
    };
  });

  let nextProgrammeChooser, eventProcessor;

  before(function () {
    nextProgrammeChooser = NextProgrammeChooser(timeService, stateMachines);

    eventProcessor = EventProcessor(myZWave, programmes, nextProgrammeChooser);

    myZWave.onNodeEvent(function (node, event) {
      eventProcessor.mainSwitchPressed(event, programme);
    });
  });

  context('when switching the lights off and on', function () {
    it('ends up in "evening" state', function () {
      switchOff();
      assert.equal(programme, 'off');

      switchOn();
      assert.equal(programme, 'evening');
    });
  });

  context('when alternating between programmes', function () {
    it('works', function () {
      switchOff();
      assert.equal(programme, 'off');

      switchOn();
      assert.equal(programme, 'evening');

      switchOn();
      assert.equal(programme, 'dimmed');

      switchOn();
      assert.equal(programme, 'evening');
    });
  });

  context('when there are multiple "off" steps', function () {
    const stateMachines = {
      evening: TimeStateMachine({
        on: {
          default: 'evening'
        },

        off: {
          default: 'tree',
          tree:    'off'
        }
      })
    };

    before(function () {
      nextProgrammeChooser = NextProgrammeChooser(timeService, stateMachines);

      eventProcessor = EventProcessor(myZWave, programmes, nextProgrammeChooser);

      myZWave.onNodeEvent(function (node, event) {
        eventProcessor.mainSwitchPressed(event, programme);
      });
    });

    it('traverses all steps', function () {
      switchOn();

      switchOff();
      assert.equal(programme, 'tree');

      switchOff();
      assert.equal(programme, 'off');
    });
  });
});
