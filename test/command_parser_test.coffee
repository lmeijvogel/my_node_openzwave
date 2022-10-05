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
        @subject.on "programmeChosen", (programmeName) -> assert.fail("programmeChosen callback should have not been called")

        @subject.parse "something something"

    context "when a programme is selected", ->
      it "calls the given block with the given programme name", ->
        callbackCalled = false

        @subject.on "programmeChosen", (programmeName)->
          callbackCalled = true
          assert.equal programmeName, "regular"

        @subject.parse "programme regular"

        assert.equal callbackCalled, true, "programmeChosen callback should have been called"

    context "when network neighbors are requested", ->
      it "calls the given block with the nodeid", ->
        callbackCalled = false

        @subject.on "neighborsRequested", (nodeid)->
          callbackCalled = true
          assert.equal nodeid, 1

        @subject.parse "neighbors 1"

        assert.equal callbackCalled, true, "neighborsRequested callback should have been called"

    context "when a network heal is requested", ->
      it "calls the given block", ->
        callbackCalled = false

        @subject.on "healNetworkRequested", ->
          callbackCalled = true

        @subject.parse "healNetwork"

        assert.equal callbackCalled, true, "healNetworkRequested callback should have been called"
