'use strict';

const Redis = require('redis');
const Logger = require('./logger');
const _ = require('lodash');

function LightsStore() {
  let redis;

  function start() {
    redis = Redis.createClient();
  }

  function storeNode(lightName, nodeId, displayName) {
    redis.hset('node_' + lightName, 'node_id', nodeId);
    redis.hset('node_' + lightName, 'display_name', displayName);

    Logger.debug('Stored in Redis: ', lightName, nodeId, displayName);
  }

  function storeValue(lightName, nodeId, commandClass, value) {
    redis.hset('node_' + lightName, 'class_' + commandClass, value.value);

    Logger.debug('Stored in Redis: ', lightName, nodeId, commandClass, value.value);
  }

  function clearNodes() {
    return new Promise(function (resolve, reject) {
      redis.keys('node_*', function (err, keys) {
        const deletePromises = _.map(keys, function (key) {
          return new Promise(function (resolveDelete, rejectDelete) {
            redis.del(key, function () {
              resolveDelete();
            });
          });
        });

        Promise.all(deletePromises).then(function () {
          resolve();
        });
      });
    });
  }

  function cleanUp() {
    redis.end();
  }

  return {
    start:      start,
    storeNode:  storeNode,
    storeValue: storeValue,
    clearNodes: clearNodes,
    cleanUp:    cleanUp
  };

}

module.exports = LightsStore;
