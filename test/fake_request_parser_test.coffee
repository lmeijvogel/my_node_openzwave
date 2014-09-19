_ = require("lodash")
assert = require("assert")
FakeRequestParser = require("../fake_request_parser")
assert.deepEqual = (expected, actual) ->
  assert.equal _.keys(expected).length, _.keys(actual).length
  for key of expected
    assert.equal expected[key], actual[key]
  return

describe "FakeRequestParser", ->
  requestParser = new FakeRequestParser()
  describe "when the request can't be parsed", ->
    request = url: "unintelligible"
    it "returns null", ->
      result = requestParser.parse(request)
      assert.equal result, null, "Result is null"
      return

    return

  describe "when the request can be parsed", ->
    request = url: "/event/3/255"
    it "returns a representation", ->
      result = requestParser.parse(request)
      expected =
        type: "event"
        node: 3
        value: 255

      assert.deepEqual expected, result, "The representations are equal"
      return

    return

  return

