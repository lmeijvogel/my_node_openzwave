'use strict';

const Redis = require('redis');
const Logger = require('./logger');
const EventEmitter = require('events').EventEmitter;
const _ = require('lodash');

function RedisInterface(commandChannel) {
  let subscriptionRedis;
  let dataRedis;

  const eventEmitter = new EventEmitter();

  function start() {
    subscriptionRedis = Redis.createClient();
    dataRedis = Redis.createClient();

    subscriptionRedis.on('message', function (channel, message) {
      Logger.verbose('Message received: ' + channel + ': "' + message + '"');
      if (channel === commandChannel) {
        eventEmitter.emit('commandReceived', message);
      }
    });

    subscriptionRedis.subscribe(commandChannel);
  }

  function getVacationMode() {
    return new Promise(function (resolve, reject) {
      dataRedis.hgetall('zwave_vacation_mode', function (err, values) {
        resolve(values || { state: 'off' });
      });
    });
  }

  function vacationModeStarted(startTime, endTime) {
    dataRedis.hset('zwave_vacation_mode', 'state', 'on');
    dataRedis.hset('zwave_vacation_mode', 'start_time', startTime);
    dataRedis.hset('zwave_vacation_mode', 'end_time', endTime);
  }

  function vacationModeStopped() {
    dataRedis.hset('zwave_vacation_mode', 'state', 'off');
    dataRedis.hdel('zwave_vacation_mode', 'start_time');
    dataRedis.hdel('zwave_vacation_mode', 'end_time');
  }

  function cleanUp() {
    subscriptionRedis.unsubscribe();
    subscriptionRedis.end();
    dataRedis.end();
  }

  function on(eventName, callback) {
    eventEmitter.on(eventName, callback);
  }

  return {
    start:                    start,
    getVacationMode:          getVacationMode,
    vacationModeStarted:      vacationModeStarted,
    vacationModeStopped:      vacationModeStopped,
    on:                       on,
    cleanUp:                  cleanUp
  };

}

module.exports = RedisInterface;
