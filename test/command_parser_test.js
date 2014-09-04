_      = require('lodash');
assert = require('assert');
CommandParser = require('../command_parser');

stub = function(result) {
  return function() { return result; }
};

describe("CommandParser", function() {
  beforeEach(function() {
    var self = this;

    this.programmeSelectedCallbackCalled = false;
    this.selectedProgrammeName = null;

    this.subject = new CommandParser({"regular": {}});
    this.subject.onProgrammeSelected(function(programmeName) {
      self.programmeSelectedCallbackCalled = true;
      self.selectedProgrammeName = programmeName;
    });
  });

  describe("parse", function() {
    context("when the command cannot be parsed", function() {
      it("does not call programmeSelected callbacks", function() {
        this.subject.parse("something something");

        assert.equal(this.programmeSelectedCallbackCalled, false, "programmeSelected callback should not have been called");
      });
    });

    context("when a programme is selected", function() {
      it("calls the programmeSelected callback with the given programme name", function() {
        this.subject.parse("programme regular");

        assert.equal(this.programmeSelectedCallbackCalled, true, "programmeSelected callback should have been called");
        assert.equal(this.selectedProgrammeName, "regular");
      });
    });
  });
});
