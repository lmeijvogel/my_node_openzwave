'use strict';

const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;

function RedisCommandParser() {
  const nodeValueRegex           = /get (\w+) (\w+) (\w+)/;
  const programmeRegex           = /programme (.*)/;
  const getNeighborsRegex        = /neighbors (.*)/;
  const healNetworkRegex         = /healNetwork/;
  const setVacationModeRegex     = /vacationMode (?:(on) start:(\d\d:\d\d) end:(\d\d:\d\d))|(off)/;
  const setNodeValueRegex        = /set (\w+) (\w+)/;
  const disableSwitchRegex       = /disableSwitch/;
  const enableSwitchRegex        = /enableSwitch/;
  const simulateSwitchPressRegex = /simulateSwitchPress (\d+)/;
  const refreshNodeRegex         = /refreshNode (\d+)/;

  const eventEmitter = new EventEmitter();

  const handlers = [
    [nodeValueRegex,           nodeValueRequested],
    [programmeRegex,           programmeChosen],
    [getNeighborsRegex,        neighborsRequested],
    [healNetworkRegex,         healNetworkRequested],
    [setVacationModeRegex,     setVacationModeRequested],
    [setNodeValueRegex,        setNodeValue],
    [disableSwitchRegex,       disableSwitch],
    [enableSwitchRegex,        enableSwitch],
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

  function setNodeValue(match) {
    const nodeId       = match[1];
    const value        = match[2];

    eventEmitter.emit('setNodeValue', nodeId, value);
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

  function setVacationModeRequested(match) {
    if (match[1] === 'on') {
      const meanStartTime = match[2];
      const meanEndTime   = match[3];

      eventEmitter.emit('setVacationModeRequested', true, meanStartTime, meanEndTime);
    } else if (match[4] === 'off') {
      eventEmitter.emit('setVacationModeRequested', false);
    }
  }

  function disableSwitch() {
    eventEmitter.emit('temporarilyDisableSwitch');
  }

  function enableSwitch() {
    eventEmitter.emit('enableSwitch');
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
