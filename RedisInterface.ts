import { RedisClient, createClient } from 'redis';

class RedisInterface {
  private redis : RedisClient;

  constructor() {
    const redisHost = process.env.REDIS_HOST || 'localhost';

    this.redis = createClient(6379, redisHost);
  }

  start() {
  }

  getVacationMode() : Promise<any> {
    return new Promise((resolve, reject) => {
      this.redis.hgetall('zwave_vacation_mode', (err, values) => {
        resolve(values || {state: 'off'});
      });
    });
  }

  vacationModeStarted(startTime: string, endTime : string) {
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

export { RedisInterface };
