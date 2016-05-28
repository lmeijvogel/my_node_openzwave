'use strict';

const Redis = require('redis');
const Logger = require('./logger');
const EventEmitter = require('events').EventEmitter;
const _ = require('lodash');

function RedisInterface(commandChannel) {
  let subscriptionRedis;
  let dataRedis;

  const eventEmitter = new EventEmitter();

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

  function clearCurrentLightLevels() {
    return new Promise(function (resolve, reject) {
      dataRedis.keys('node_*', function (err, keys) {
        const deletePromises = _.map(keys, function (key) {
          return new Promise(function (resolveDelete, rejectDelete) {
            dataRedis.del(key, function () {
              resolveDelete();
            });
          });
        });

        Promise.all(deletePromises).then(function () {
          resolve();
        });
      });
    });
  }

  function clearAvailableProgrammes() {
    return new Promise(function (resolve) {
      dataRedis.del('zwave_available_programmes', function () {
        resolve();
      });
    });
  }

  function addAvailableProgramme(name, displayName) {
    dataRedis.hset('zwave_available_programmes', name, displayName);
  }

  function vacationModeStarted(startTime, endTime) {
    dataRedis.hset('zwave_vacation_mode', 'state', 'on');
    dataRedis.hset('zwave_vacation_mode', 'start_time', startTime);
    dataRedis.hset('zwave_vacation_mode', 'end_time', endTime);
  }

  function vacationModeStopped() {
    dataRedis.hset('zwave_vacation_mode', 'state', 'off');
    dataRedis.hdel('zwave_vacation_mode', 'start_time');
    dataRedis.hdel('zwave_vacation_mode', 'end_time');
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
    vacationModeStarted:      vacationModeStarted,
    vacationModeStopped:      vacationModeStopped,
    storeValue:               storeValue,
    clearCurrentLightLevels:  clearCurrentLightLevels,
    clearAvailableProgrammes: clearAvailableProgrammes,
    addAvailableProgramme:    addAvailableProgramme,
    on:                       on,
    cleanUp:                  cleanUp
  };

}

module.exports = RedisInterface;
