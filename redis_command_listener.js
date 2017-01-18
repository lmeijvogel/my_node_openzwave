'use strict';

const Redis = require('redis');
const Logger = require('./logger');
const EventEmitter = require('events').EventEmitter;

function RedisCommandListener(subscribedChannel) {
  let redis;

  const eventEmitter = new EventEmitter();

  function start() {
    redis = Redis.createClient();

    redis.on('message', function (sourceChannel, message) {
      Logger.verbose('Message received: ' + sourceChannel + ': "' + message + '"');
      if (sourceChannel === subscribedChannel) {
        eventEmitter.emit('commandReceived', message);
      }
    });

    redis.subscribe(subscribedChannel);
  }

  function cleanUp() {
    redis.unsubscribe();
    redis.end();
  }

  function on(eventName, callback) {
    eventEmitter.on(eventName, callback);
  }

  return {
    start:                    start,
    on:                       on,
    cleanUp:                  cleanUp
  };

}

module.exports = RedisCommandListener;
