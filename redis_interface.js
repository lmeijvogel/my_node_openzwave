'use strict';

const Redis = require('redis');
const Logger = require('./logger');
const _ = require('lodash');

function RedisInterface() {
  let redis;

  function start() {
    redis = Redis.createClient();
  }

  function programmeChanged(name) {
    Logger.verbose('Storing new programme in Redis: "%s"', name);
    redis.set('zwave_programme', name);
  }

  function storeNode(lightName, nodeId, displayName) {
    redis.hset('node_' + lightName, 'node_id', nodeId);
    redis.hset('node_' + lightName, 'display_name', displayName);

    Logger.debug('Stored in Redis: ', lightName, nodeId, displayName);
  }

  function storeValue(lightName, nodeId, commandClass, value) {
    redis.hset('node_' + lightName, 'class_' + commandClass, value.value);

    Logger.debug('Stored in Redis: ', lightName, nodeId, commandClass, value.value);
  }

  function clearCurrentLightLevels() {
    return new Promise(function (resolve, reject) {
      redis.keys('node_*', function (err, keys) {
        const deletePromises = _.map(keys, function (key) {
          return new Promise(function (resolveDelete, rejectDelete) {
            redis.del(key, function () {
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

  function getVacationMode() {
    return new Promise(function (resolve, reject) {
      redis.hgetall('zwave_vacation_mode', function (err, values) {
        resolve(values);
      });
    });
  }

  function clearAvailableProgrammes() {
    return new Promise(function (resolve) {
      redis.del('zwave_available_programmes', function () {
        resolve();
      });
    });
  }

  function addAvailableProgramme(name, displayName) {
    redis.hset('zwave_available_programmes', name, displayName);
  }

  function vacationModeStarted(startTime, endTime) {
    redis.hset('zwave_vacation_mode', 'state', 'on');
    redis.hset('zwave_vacation_mode', 'start_time', startTime);
    redis.hset('zwave_vacation_mode', 'end_time', endTime);
  }

  function vacationModeStopped() {
    redis.hset('zwave_vacation_mode', 'state', 'off');
    redis.hdel('zwave_vacation_mode', 'start_time');
    redis.hdel('zwave_vacation_mode', 'end_time');
  }

  function switchDisabled() {
    redis.set('zwave_switch_enabled', false);
  }

  function switchEnabled() {
    redis.set('zwave_switch_enabled', true);
  }

  function cleanUp() {
    redis.end();
  }

  return {
    start:                    start,
    programmeChanged:         programmeChanged,
    getVacationMode:          getVacationMode,
    vacationModeStarted:      vacationModeStarted,
    vacationModeStopped:      vacationModeStopped,
    storeNode:                storeNode,
    storeValue:               storeValue,
    clearCurrentLightLevels:  clearCurrentLightLevels,
    clearAvailableProgrammes: clearAvailableProgrammes,
    addAvailableProgramme:    addAvailableProgramme,
    switchEnabled:            switchEnabled,
    switchDisabled:           switchDisabled,
    cleanUp:                  cleanUp
  };

}

module.exports = RedisInterface;
