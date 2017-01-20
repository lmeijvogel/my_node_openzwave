'use strict';
const _ = require('lodash');
const assert = require('assert');
const RedisCommandListener = require('../redis_command_listener');

const stub = (result) => function () { return result; };

// I would have rather used a real Redis instance for testing,
// but due to timing issues (sending a message happened too soon
// after subscribing), I opted for a stub instead.
let redis = function () {
  let callback;
  let subscribedChannel;

  function on(eventName, eventHandler) {
    callback = eventHandler;
  }

  function sendMessage(channel, message) {
    callback(channel, message);
  }

  function subscribe(channel) {
    subscribedChannel = channel;
  }

  function unsubscribe() {
    subscribedChannel = null;
  }

  function subscribed() {
    return subscribedChannel !== null;
  }

  return {on: on,
          sendMessage: sendMessage,
          subscribe: subscribe,
          unsubscribe: unsubscribe,
          subscribed
  };
}();

let subject;
let channel = 'MyTestChannel';
let parser;

describe('RedisCommandListener', function () {
  beforeEach(function () {
    parser = {};
    subject = new RedisCommandListener(redis, channel, parser);
    subject.start();
    assert.equal(redis.subscribed(), true);
  });

  afterEach(function () {
    subject.end();
    assert.equal(redis.subscribed(), false);
  });

  describe('when a message is received', function () {
    context('when it is not on the specified channel', function () {
      it('does not invoke the parser', function () {
        parser.parse = function (message) {
          assert.fail('command was sent to the parser.');
        };

        process.nextTick(function () {
          redis.sendMessage('someChannel', 'boe');
        });
      });
    });

    context('when is it on the specified channel', function () {
      it('invokes the parser', function () {
        let invoked = false;

        parser.parse = function (message) {
          assert.equal(message, 'the message');
          invoked = true;
        };

        redis.sendMessage(channel, 'the message');

        assert.equal(invoked, true);
      });
    });
  });
});

