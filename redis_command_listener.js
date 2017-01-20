'use strict';

const Redis = require('redis');
const Logger = require('./logger');

function RedisCommandListener(subscribedChannel, parser) {
  let redis;

  function start() {
    redis = Redis.createClient();

    redis.on('message', function (sourceChannel, message) {
      Logger.verbose('Message received: ' + sourceChannel + ': "' + message + '"');
      if (sourceChannel === subscribedChannel) {
        parser.parse(message);
      }
    });

    redis.subscribe(subscribedChannel);
  }

  function end() {
    redis.unsubscribe();
    redis.end();
  }

  return {
    start: start,
    end:   end
  };

}

module.exports = RedisCommandListener;
