'use strict';

const _ = require('lodash');
const assert = require('assert');
const FakeRequestParser = require('../fake_request_parser');

assert.deepEqual = function (expected, actual) {
  assert.equal(_.keys(expected).length, _.keys(actual).length);

  _(expected).each((key) => assert.equal(expected[key], actual[key]));
};

let request = null;

describe('FakeRequestParser', function () {
  const requestParser = FakeRequestParser();

  describe('when the request can\'t be parsed', function () {
    beforeEach(function () {
      request = {url: 'unintelligible'};
    });

    it('returns null', function () {
      const result = requestParser.parse(request);

      assert.equal(result, null, 'Result is null');
    });
  });

  describe('when the request can be parsed', function () {
    beforeEach(function () {
      request = {url: '/event/3/255'};
    });

    it('returns a representation', function () {
      const result = requestParser.parse(request);

      const expected = {
        type: 'event',
        node: 3,
        value: 255
      };

      assert.deepEqual(expected, result, 'The representations are equal');
    });
  });
});
