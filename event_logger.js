'use strict';

const Redis = require('redis');
const _ = require('lodash');

class EventLogger {
  constructor() {
    this.redis = null;
  }

  start() {
    this.redis = Redis.createClient();
  }

  store(event) {
    const datedEvent = _.extend({}, event, {time: new Date()});

    this.redis.lpush('zwave_recent_events', JSON.stringify(datedEvent));
    this.redis.ltrim('zwave_recent_events', 0, 50);
  }

  stop() {
    this.redis.end();
  }
};

module.exports = EventLogger;
