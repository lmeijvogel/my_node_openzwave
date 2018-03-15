'use strict';

const Redis = require('redis');

function RedisInterface(commandChannel) {
  let redis;

  function start() {
    const redisHost = process.env.REDIS_HOST || 'localhost';

    redis = Redis.createClient(6379, redisHost);
  }

  function getVacationMode() {
    return new Promise(function (resolve, reject) {
      redis.hgetall('zwave_vacation_mode', function (err, values) {
        resolve(values || {state: 'off'});
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

module.exports = RedisInterface;
