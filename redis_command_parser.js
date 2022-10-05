'use strict';

const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;

function RedisCommandParser() {
  const nodeValueRegex           = /get (\w+) (\w+) (\w+)/;
  const getNeighborsRegex        = /neighbors (.*)/;
  const healNetworkRegex         = /healNetwork/;
  const simulateSwitchPressRegex = /simulateSwitchPress (\d+)/;
  const refreshNodeRegex         = /refreshNode (\d+)/;

  const eventEmitter = new EventEmitter();

  const handlers = [
    [nodeValueRegex,           nodeValueRequested],
    [getNeighborsRegex,        neighborsRequested],
    [healNetworkRegex,         healNetworkRequested],
    [simulateSwitchPressRegex, simulateSwitchPress],
    [refreshNodeRegex,         refreshNodeRequested]
  ];

  function parse(command) {
    _.each(handlers, function (handler) {
      const regex = handler[0];
      const callback = handler[1];

      const match = command.match(regex);

      if (match) {
        callback(match);
        return;
      }
    });
  }

  function nodeValueRequested(match) {
    const nodeId       = match[1];
    const commandClass = match[2];
    const index        = match[3];

    eventEmitter.emit('nodeValueRequested', nodeId, commandClass, index);
  }

  function neighborsRequested(match) {
    const nodeId = parseInt(match[1], 10);

    eventEmitter.emit('neighborsRequested', nodeId);
  }

  function healNetworkRequested() {
    eventEmitter.emit('healNetworkRequested');
  }

  function simulateSwitchPress(match) {
    const event = parseInt(match[1], 10);

    eventEmitter.emit('simulateSwitchPress', event);
  }

  function refreshNodeRequested(match) {
    const nodeId = parseInt(match[1], 10);

    eventEmitter.emit('refreshNodeRequested', nodeId);
  }

  function on(eventName, handler) {
    eventEmitter.on(eventName, handler);
  }

  return {
    parse: parse,
    on: on
  };
}

module.exports = RedisCommandParser;
