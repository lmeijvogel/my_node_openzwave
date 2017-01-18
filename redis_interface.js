'use strict';

const Redis = require('redis');

function RedisInterface() {
  let redis;

  function start() {
    redis = Redis.createClient();
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
    switchEnabled:            switchEnabled,
    switchDisabled:           switchDisabled,
    cleanUp:                  cleanUp
  };

}

module.exports = RedisInterface;
