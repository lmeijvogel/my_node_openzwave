_ = require("lodash")
assert = require("assert")
FakeRequestParser = require("../fake_request_parser")

assert.deepEqual = (expected, actual) ->
  assert.equal(_.keys(expected).length, _.keys(actual).length)

  _(expected).each( (key) ->
    assert.equal expected[key], actual[key]
  )

describe "FakeRequestParser", ->
  requestParser = FakeRequestParser()
  describe "when the request can't be parsed", ->
    beforeEach ->
      @request = url: "unintelligible"

    it "returns null", ->
      result = requestParser.parse(@request)
      assert.equal result, null, "Result is null"

  describe "when the request can be parsed", ->
    beforeEach ->
      @request = url: "/event/3/255"

    it "returns a representation", ->
      result = requestParser.parse(@request)

      expected =
        type: "event"
        node: 3
        value: 255

      assert.deepEqual expected, result, "The representations are equal"
