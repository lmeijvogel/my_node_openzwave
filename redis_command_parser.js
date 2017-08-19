'use strict';

const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;

function RedisCommandParser() {
  const simulateSwitchPressRegex = /simulateSwitchPress (\d+)/;
  const refreshNodeRegex         = /refreshNode (\d+)/;

  const eventEmitter = new EventEmitter();

  const handlers = [
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
