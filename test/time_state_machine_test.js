var assert = require('assert');
var TimeStateMachine = require('../time_state_machine');

describe("TimeStateMachine", function() {
  beforeEach(function() {
    this.subject = new TimeStateMachine({
      on: {
        morning: "afternoon",
        default: "evening"
      }
    });
  });

  context("when the transition is configured", function() {
    beforeEach(function() {
      this.subject.setState("morning");
    });

    it("follows it", function() {
      this.subject.handle("on");

      assert.equal(this.subject.state, "afternoon");
    });
  });

  context("when the transition is not configured", function() {
    beforeEach(function() {
      this.subject.setState("something");
    });

    it("follows the default", function() {
      this.subject.handle("on");

      assert.equal(this.subject.state, "evening");
    });
  });

  context("when the event is not configured", function() {
    beforeEach(function() {
      this.subject.setState("afternoon");
    });

    it("does not do anything", function() {
      this.subject.handle("something");

      assert.equal(this.subject.state, "afternoon");
    });
  });
});
