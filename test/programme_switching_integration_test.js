var assert               = require('assert');
var Node                 = require('../node');
var _                    = require('lodash');

var NextProgrammeChooser = require('../next_programme_chooser');
var TimeStateMachine     = require('../time_state_machine');
var EventProcessor       = require('../event_processor');

describe("integration", function () {
  var handler;

  var myZWave = {
    onNodeEvent: function (h) { handler = h; }
  };

  var timeService = {
    getPeriod: function () { return "evening"; }
  };

  var switchOff = function () {
    handler.call(myZWave, Node(3), 0);
  };

  var switchOn  = function () {
    handler.call(myZWave, Node(3), 255);
  };

  var stateMachines = {
    evening: TimeStateMachine({
      on: {
        evening: "dimmed",
        default: "evening"
      },

      off: {
        default: "off"
      }
    })
  };

  var programme;
  var programmes = {};

  _(['evening', 'tree', 'dimmed', 'off']).each( function (name) {
    programmes[name] = {
      name:  name,
      apply: function () {
        programme = name;
      }
    };
  });

  var nextProgrammeChooser;

  before(function () {
    nextProgrammeChooser = NextProgrammeChooser(timeService, stateMachines);

    EventProcessor(myZWave, programmes, nextProgrammeChooser);
  });

  context("when switching the lights off and on", function () {
    it("ends up in 'evening' state", function () {
      switchOff();
      assert.equal(programme, "off");

      switchOn();
      assert.equal(programme, "evening");
    });
  });

  context("when alternating between programmes", function () {
    it("works", function () {
      switchOff();
      assert.equal(programme, "off");

      switchOn();
      assert.equal(programme, "evening");

      switchOn();
      assert.equal(programme, "dimmed");

      switchOn();
      assert.equal(programme, "evening");
    });
  });

  context("when there are multiple 'off' steps", function () {
    var stateMachines = {
      evening: TimeStateMachine({
        on: {
          default: "evening"
        },

        off: {
          default: "tree",
          tree:    "off"
        }
      })
    };

    before(function () {
      nextProgrammeChooser = NextProgrammeChooser(timeService, stateMachines);

      EventProcessor(myZWave, programmes, nextProgrammeChooser);
    });

    it('traverses all steps', function () {
      switchOn();

      switchOff();
      assert.equal(programme, "tree");

      switchOff();
      assert.equal(programme, "off");
    });
  });
});
