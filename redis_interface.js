'use strict';

var Redis = require('redis');
var Logger = require('./logger');
var EventEmitter = require('events').EventEmitter;

function RedisInterface(commandChannel) {
  var subscriptionRedis;
  var dataRedis;

  var eventEmitter = new EventEmitter();

  function start() {
    subscriptionRedis = Redis.createClient();
    dataRedis = Redis.createClient();

    subscriptionRedis.on('message', function (channel, message) {
      Logger.verbose('Message received: ' + channel + ': "' + message + '"');
      if (channel === commandChannel) {
        eventEmitter.emit('commandReceived', message);
      }
    });

    subscriptionRedis.subscribe(commandChannel);
  }

  function programmeChanged(name) {
    Logger.verbose('Storing new programme in Redis: "%s"', name);
    dataRedis.set('zwave_programme', name);
  }

  function storeValue(lightName, commandClass, value) {
    dataRedis.hset('node_' + lightName, 'class_' + commandClass, value.value);

    Logger.debug('Stored in Redis: ', lightName, commandClass, value.value);
  }

  function clearAvailableProgrammes() {
    dataRedis.del('zwave_available_programmes');
  }

  function addAvailableProgramme(name, displayName) {
    dataRedis.hset('zwave_available_programmes', name, displayName);
  }

  function cleanUp() {
    subscriptionRedis.unsubscribe();
    subscriptionRedis.end();
    dataRedis.end();
  }

  function on(eventName, callback) {
    eventEmitter.on(eventName, callback);
  }

  return {
    start:                    start,
    programmeChanged:         programmeChanged,
    storeValue:               storeValue,
    clearAvailableProgrammes: clearAvailableProgrammes,
    addAvailableProgramme:    addAvailableProgramme,
    on:                       on,
    cleanUp:                  cleanUp
  };

}

module.exports = RedisInterface;
