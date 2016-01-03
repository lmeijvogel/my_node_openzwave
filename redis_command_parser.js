'use strict';

const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;

function RedisCommandParser() {
  const nodeValueRegex    = /get (\w+) (\w+) (\w+)/;
  const programmeRegex    = /programme (.*)/;
  const getNeighborsRegex = /neighbors (.*)/;
  const healNetworkRegex  = /healNetwork/;

  const eventEmitter = new EventEmitter();

  const handlers = [
    [nodeValueRegex,    nodeValueRequested],
    [programmeRegex,    programmeChosen],
    [getNeighborsRegex, neighborsRequested],
    [healNetworkRegex,  healNetworkRequested]
  ];

  function parse(command) {
    _.each(handlers, function (handler) {
      const key   = handler[0];
      const value = handler[1];

      const match = command.match(key);

      if (match) {
        value.call(null, match);
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

  function programmeChosen(match) {
    const programmeName = match[1];

    eventEmitter.emit('programmeChosen', programmeName);
  }

  function neighborsRequested(match) {
    const nodeId = parseInt(match[1], 10);

    eventEmitter.emit('neighborsRequested', nodeId);
  }

  function healNetworkRequested() {
    eventEmitter.emit('healNetworkRequested');
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
