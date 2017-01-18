'use strict';

const Redis = require('redis');
const Logger = require('./logger');

function ProgrammesStore() {
  let redis;

  function start() {
    redis = Redis.createClient();
  }

  function programmeChanged(name) {
    Logger.verbose('Storing new programme in Redis: "%s"', name);
    redis.set('zwave_programme', name);
  }

  function clearProgrammes() {
    return new Promise(function (resolve) {
      redis.del('zwave_available_programmes', function () {
        resolve();
      });
    });
  }

  function addProgramme(name, displayName) {
    redis.hset('zwave_available_programmes', name, displayName);
  }

  function cleanUp() {
    redis.end();
  }

  return {
    start:            start,
    programmeChanged: programmeChanged,
    clearProgrammes:  clearProgrammes,
    addProgramme:     addProgramme,
    cleanUp:          cleanUp
  };

}

module.exports = ProgrammesStore;
