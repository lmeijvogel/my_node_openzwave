'use strict';

const Redis = require('redis');
const _ = require('lodash');

module.exports = function () {
  let redis = null;

  function start() {
    const redisHost = process.env.REDIS_HOST || 'localhost';

    redis = Redis.createClient(6379, redisHost);
  }

  function store(event) {
    const datedEvent = _.extend({}, event, {time: new Date()});

    redis.lpush('zwave_recent_events', JSON.stringify(datedEvent));
    redis.ltrim('zwave_recent_events', 0, 50);
  }

  function stop() {
    redis.end();
  }

  return {
    start: start,
    store: store,
    stop: stop
  };
};
