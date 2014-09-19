_      = require('lodash');
assert = require('assert');
NextProgrammeChooser = require('../next_programme_chooser');

stub = function(result) {
  return function() { return result; }
};

describe("NextProgrammeChooser", function() {
  beforeEach(function() {
    var self = this;

    this.subject = new NextProgrammeChooser();
    this.timeService = {};
    this.subject.timeService = this.timeService;

    _(["isMorning", "isEvening", "isNight"]).each(function(method) {
      self.timeService[method] = stub(false);
    });
  });
  describe("chooseStateMachine", function() {
    _([
        ["isMorning", "morning"],
        ["isEvening", "evening"],
        ["isNight", "night"]
    ]).each(function(pair) {
      var method = pair[0];
      var name   = pair[1];

      context("when it is "+name, function() {
        beforeEach(function() {
          this.timeService[method] = stub(true);
        });

        it("sets the correct state machine", function() {
          var result = this.subject.chooseStateMachine();

          assert.equal(result, this.subject.stateMachines[name]);
        });
      });
    });

    // This should of course never happen, but it's nice
    // to know that at least some lights will always turn on.
    context("when the time is unknown", function() {
      it("default to 'morning'", function() {
        var result = this.subject.chooseStateMachine();
        assert.equal(result, this.subject.stateMachines.morning);
      });
    });
  });

  describe("handle", function() {
    describe("the result", function() {
      it("returns the chosen state", function() {
        var mockStateMachine = {
          handle:   function() { return "dimmed"; },
          setState: function() {}
        };

        this.subject.chooseStateMachine = function() { return mockStateMachine; };

        var result = this.subject.handle("on");

        assert.equal(result, "dimmed");
      });
    });
  });
});
