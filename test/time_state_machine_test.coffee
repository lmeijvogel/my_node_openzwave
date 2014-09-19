assert = require("assert")
TimeStateMachine = require("../time_state_machine")
describe "TimeStateMachine", ->
  beforeEach ->
    @subject = new TimeStateMachine(on:
      morning: "afternoon"
      default: "evening"
    )
    return

  context "when the transition is configured", ->
    beforeEach ->
      @subject.setState "morning"
      return

    it "follows it", ->
      @subject.handle "on"
      assert.equal @subject.state, "afternoon"
      return

    return

  context "when the transition is not configured", ->
    beforeEach ->
      @subject.setState "something"
      return

    it "follows the default", ->
      @subject.handle "on"
      assert.equal @subject.state, "evening"
      return

    return

  context "when the event is not configured", ->
    beforeEach ->
      @subject.setState "afternoon"
      return

    it "does not do anything", ->
      @subject.handle "something"
      assert.equal @subject.state, "afternoon"
      return

    return

  return

