_ = require("lodash")
assert = require("assert")
CommandParser = require("../command_parser")
stub = (result) ->
  ->
    result

describe "CommandParser", ->
  beforeEach ->
    @programmeSelectedCallbackCalled = false
    @selectedProgrammeName = null
    @subject = new CommandParser(regular: {})
    @subject.onProgrammeSelected (programmeName) =>
      @programmeSelectedCallbackCalled = true
      @selectedProgrammeName = programmeName
      return

    return

  describe "parse", ->
    context "when the command cannot be parsed", ->
      it "does not call programmeSelected callbacks", ->
        @subject.parse "something something"
        assert.equal @programmeSelectedCallbackCalled, false, "programmeSelected callback should not have been called"
        return

      return

    context "when a programme is selected", ->
      it "calls the programmeSelected callback with the given programme name", ->
        @subject.parse "programme regular"
        assert.equal @programmeSelectedCallbackCalled, true, "programmeSelected callback should have been called"
        assert.equal @selectedProgrammeName, "regular"
        return

      return

    return

  return

