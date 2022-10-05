assert = require("assert")
TimeStateMachine = require("../time_state_machine")
describe "TimeStateMachine", ->
  beforeEach ->
    @subject = TimeStateMachine(
      on:
        morning: "afternoon"
        default: "evening"
      off:
        default: "mostly_off"
        mostly_off: "off"
    )

  context "when the transition is configured", ->
    beforeEach ->
      @subject.setState "morning"

    it "follows it", ->
      @subject.handle "on"
      assert.equal @subject.getState(), "afternoon"

    it "even works on the off switch", ->
      @subject.handle "off"
      assert.equal @subject.getState(), "mostly_off"

      @subject.handle "off"
      assert.equal @subject.getState(), "off"

  context "when the transition is not configured", ->
    beforeEach ->
      @subject.setState "something"

    it "follows the default", ->
      @subject.handle "on"
      assert.equal @subject.getState(), "evening"

  context "when the event is not configured", ->
    beforeEach ->
      @subject.setState "afternoon"

    it "does not do anything", ->
      @subject.handle "something"
      assert.equal @subject.getState(), "afternoon"
