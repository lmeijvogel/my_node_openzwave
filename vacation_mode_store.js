'use strict';

const Redis = require('redis');

function VacationModeStore() {
  let redis;

  function start() {
    redis = Redis.createClient();
  }

  function getVacationMode() {
    return new Promise(function (resolve, reject) {
      redis.hgetall('zwave_vacation_mode', function (err, values) {
        resolve(values);
      });
    });
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

  function cleanUp() {
    redis.end();
  }

  return {
    start:                    start,
    getVacationMode:          getVacationMode,
    vacationModeStarted:      vacationModeStarted,
    vacationModeStopped:      vacationModeStopped,
    cleanUp:                  cleanUp
  };

}

module.exports = VacationModeStore;
