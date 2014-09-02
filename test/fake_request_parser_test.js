var _ = require('lodash');
var assert = require('assert');
var FakeRequestParser = require('../fake_request_parser');

assert.deepEqual = function(expected, actual) {
  assert.equal(_.keys(expected).length, _.keys(actual).length);

  for (key in expected) {
    assert.equal(expected[key], actual[key]);
  }
};

describe('FakeRequestParser', function() {
  var requestParser = new FakeRequestParser();

  describe("when the request can't be parsed", function() {
    var request = { url: "unintelligible" };

    it("returns null", function() {
      var result = requestParser.parse(request);
      assert.equal(result, null, "Result is null");
    });
  });

  describe("when the request can be parsed", function() {
    var request = { url: "/event/3/255" };

    it("returns a representation", function() {
      var result = requestParser.parse(request);
      var expected = { type: "event", node: 3, value: 255 };

      assert.deepEqual(expected, result, "The representations are equal");
    });
  });
});
