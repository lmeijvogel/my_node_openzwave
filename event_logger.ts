import { RedisClient, createClient } from 'redis';
import { extend } from 'lodash';

class EventLogger {
  private redis : RedisClient;

  constructor() {
    const redisHost = process.env.REDIS_HOST || 'localhost';

    this.redis = createClient(6379, redisHost);
  }

  start() {
  }

  store(event) {
    const datedEvent = extend({}, event, {time: new Date()});

    this.redis.lpush('zwave_recent_events', JSON.stringify(datedEvent));
    this.redis.ltrim('zwave_recent_events', 0, 50);
  }

  stop() {
    this.redis.end();
  }
};

export { EventLogger };
