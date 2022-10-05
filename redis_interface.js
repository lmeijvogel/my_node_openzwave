'use strict';

const Redis = require('redis');

class RedisInterface {
  constructor(commandChannel) {
    this.commandChannel = commandChannel;
    this.redis = null;
  }

  start() {
    const redisHost = process.env.REDIS_HOST || 'localhost';

    this.redis = Redis.createClient(6379, redisHost);
  }

  getVacationMode() {
    return new Promise((resolve, reject) => {
      this.redis.hgetall('zwave_vacation_mode', (err, values) => {
        resolve(values || {state: 'off'});
      });
    });
  }

  vacationModeStarted(startTime, endTime) {
    this.redis.hset('zwave_vacation_mode', 'state', 'on');
    this.redis.hset('zwave_vacation_mode', 'start_time', startTime);
    this.redis.hset('zwave_vacation_mode', 'end_time', endTime);
  }

  vacationModeStopped() {
    this.redis.hset('zwave_vacation_mode', 'state', 'off');
    this.redis.hdel('zwave_vacation_mode', 'start_time');
    this.redis.hdel('zwave_vacation_mode', 'end_time');
  }

  cleanUp() {
    this.redis.end();
  }
}

module.exports = RedisInterface;
