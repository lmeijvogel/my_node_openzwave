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

    @timeService = {}

    @subject = new NextProgrammeChooser(@timeService, @stateMachines)

  describe "chooseStateMachine", ->
    _(["morning" , "evening" , "night"]).each (period) ->
      context "when it is #{period}", ->
        beforeEach ->
          @timeService.getPeriod = -> period

        it "sets the correct state machine", ->
          result = @subject.chooseStateMachine()
          assert.equal result, @stateMachines[period]

    # This should of course never happen, but it's nice
    # to know that at least some lights will always turn on.
    context "when the time is unknown", ->
      beforeEach ->
        @timeService.getPeriod = -> undefined

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
