'use strict';

const Redis = require('redis');
const Logger = require('./logger');

function RedisInterface() {
  let redis;

  function start() {
    redis = Redis.createClient();
  }

  function programmeChanged(name) {
    Logger.verbose('Storing new programme in Redis: "%s"', name);
    redis.set('zwave_programme', name);
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
    clearAvailableProgrammes: clearAvailableProgrammes,
    addAvailableProgramme:    addAvailableProgramme,
    switchEnabled:            switchEnabled,
    switchDisabled:           switchDisabled,
    cleanUp:                  cleanUp
  };

}

module.exports = RedisInterface;
