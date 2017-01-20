'use strict';

const Logger = require('./logger');

function RedisCommandListener(redis, subscribedChannel, parser) {
  function start() {
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
  }

  return {
    start: start,
    end:   end
  };

}

module.exports = RedisCommandListener;
