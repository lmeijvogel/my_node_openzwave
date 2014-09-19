_ = require("lodash")
assert = require("assert")
NextProgrammeChooser = require("../next_programme_chooser")
stub = (result) ->
  ->
    result

describe "NextProgrammeChooser", ->
  beforeEach ->
    self = this
    @subject = new NextProgrammeChooser()
    @timeService = {}
    @subject.timeService = @timeService
    _([
      "isMorning"
      "isEvening"
      "isNight"
    ]).each (method) ->
      self.timeService[method] = stub(false)
      return

    return

  describe "chooseStateMachine", ->
    _([
      [
        "isMorning"
        "morning"
      ]
      [
        "isEvening"
        "evening"
      ]
      [
        "isNight"
        "night"
      ]
    ]).each (pair) ->
      method = pair[0]
      name = pair[1]
      context "when it is " + name, ->
        beforeEach ->
          @timeService[method] = stub(true)
          return

        it "sets the correct state machine", ->
          result = @subject.chooseStateMachine()
          assert.equal result, @subject.stateMachines[name]
          return

        return

      return

    
    # This should of course never happen, but it's nice
    # to know that at least some lights will always turn on.
    context "when the time is unknown", ->
      it "default to 'morning'", ->
        result = @subject.chooseStateMachine()
        assert.equal result, @subject.stateMachines.morning
        return

      return

    return

  describe "handle", ->
    describe "the result", ->
      it "returns the chosen state", ->
        mockStateMachine =
          handle: ->
            "dimmed"

          setState: ->

        @subject.chooseStateMachine = ->
          mockStateMachine

        result = @subject.handle("on")
        assert.equal result, "dimmed"
        return

      return

    return

  return

