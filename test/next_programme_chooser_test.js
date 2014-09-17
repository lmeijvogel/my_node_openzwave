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

    _(["isMorning", "isEvening", "isNight"]).each(function(method) {
      self.subject[method] = stub(false);
    });
  });

  describe("handle", function() {
    _([
        ["isMorning", "morning"],
        ["isEvening", "evening"],
        ["isNight", "night"]
    ]).each(function(pair) {
      var method = pair[0];
      var name   = pair[1];

      context("when it is "+name, function() {
        beforeEach(function() {
          this.subject[method] = stub(true);
        });

        it("sets the correct state machine", function() {
          this.subject.handle("on");
          assert.equal(this.subject.currentStateMachine, this.subject.stateMachines[name]);
        });
      });
    });

    // This should of course never happen.
    context("when the time is unknown", function() {
      it("default to 'morning'", function() {
        this.subject.handle("on");
        assert.equal(this.subject.currentStateMachine, this.subject.stateMachines.morning);
      });
    });
  });

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
