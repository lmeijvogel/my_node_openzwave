_ = require("lodash")
assert = require("assert")
CommandParser = require("../command_parser")

stub = (result) -> (-> return result)

describe "CommandParser", ->
  beforeEach ->
    @subject = new CommandParser(regular: {})

  describe "parse", ->
    context "when the command cannot be parsed", ->
      it "does not call programmeSelected callbacks", ->
        @subject.parse "something something", ->
          assert.fail("Callback should not have been called")

    context "when a programme is selected", ->
      it "calls the given block with the given programme name", ->
        programmeSelectedCallbackCalled = false

        @subject.parse "programme regular", (programmeName)->
          programmeSelectedCallbackCalled = true
          assert.equal programmeName, "regular"

        assert.equal programmeSelectedCallbackCalled, true, "programmeSelected callback should have been called"
