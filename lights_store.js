'use strict';

const Logger = require('./logger');
const _ = require('lodash');

function LightsStore(redis) {
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

  return {
    storeNode:  storeNode,
    storeValue: storeValue,
    clearNodes: clearNodes,
  };

}

module.exports = LightsStore;
