_ = require("lodash")
assert = require("assert")
NextProgrammeChooser = require("../next_programme_chooser")

stub = (result) ->
  -> result

describe "NextProgrammeChooser", ->
  beforeEach ->
    @stateMachines =
      morning: {}
      evening: {}
      night:   {}

    @subject = new NextProgrammeChooser(@stateMachines)

    @timeService = {}
    @subject.timeService = @timeService

    _([ "isMorning", "isEvening", "isNight" ]).each (method) =>
      @timeService[method] = stub(false)

  describe "chooseStateMachine", ->
    _([
      [ "isMorning", "morning" ]
      [ "isEvening", "evening" ]
      [ "isNight",   "night"   ]
    ]).each (pair) ->
      [method, name] = pair

      context "when it is #{name}", ->
        beforeEach ->
          @timeService[method] = stub(true)

        it "sets the correct state machine", ->
          result = @subject.chooseStateMachine()
          assert.equal result, @stateMachines[name]

    # This should of course never happen, but it's nice
    # to know that at least some lights will always turn on.
    context "when the time is unknown", ->
      it "default to 'morning'", ->
        result = @subject.chooseStateMachine()
        assert.equal result, @stateMachines.morning

  describe "handle", ->
    describe "the result", ->
      it "returns the chosen state", ->
        mockStateMachine =
          handle: -> "dimmed"
          setState: ->

        @subject.chooseStateMachine = (-> mockStateMachine)

        result = @subject.handle("on")
        assert.equal result, "dimmed"
