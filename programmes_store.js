'use strict';

const Logger = require('./logger');

function ProgrammesStore(redis) {
  let _currentProgramme;

  function currentProgramme() {
    return _currentProgramme;
  }

  function programmeChanged(name) {
    _currentProgramme = name;

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

  return {
    currentProgramme: currentProgramme,
    programmeChanged: programmeChanged,
    clearProgrammes:  clearProgrammes,
    addProgramme:     addProgramme,
  };

}

module.exports = ProgrammesStore;
