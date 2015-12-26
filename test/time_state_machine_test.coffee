assert = require("assert")
TimeStateMachine = require("../time_state_machine")
describe "TimeStateMachine", ->
  beforeEach ->
    @subject = new TimeStateMachine(on:
      morning: "afternoon"
      default: "evening"
    )

  context "when the transition is configured", ->
    beforeEach ->
      @subject.setState "morning"

    it "follows it", ->
      @subject.handle "on"
      assert.equal @subject.getState(), "afternoon"

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
