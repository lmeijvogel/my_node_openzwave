'use strict';

/*
 * This is for testing to see some feedback.

 * To make it possible to test interactions
 * without actually having to connect the ZWave
 * unit: Web requests can be used to simulate a
 * button press.

 * Node will never be ready since it is a battery powered
 * switch, reporting as little as possible.
 */

const _                 = require('lodash');

const FakeRequestParser = require('./fake_request_parser');
const Logger            = require('./logger');

function FakeZWave() {
  let callbacks = {};
  let nodes = {};
  const SWITCH_BINARY = 37;
  const SWITCH_MULTILEVEL = 38;

  const fakeRequestParser = FakeRequestParser();

  function on(eventName, callback) {
    if (!callbacks[eventName]) {
      callbacks[eventName] = [];
    }

    callbacks[eventName].push(callback);
  }

  function connect() {
    const homeId = '128';

    emitEvent('driver ready', [homeId]);

    initializeDevices();

    emitEvent('scan complete');
    setLevel(2, 99);

    setLevel(5, 99);
    switchOn(7);
    setLevel(8, 99);
    setLevel(2, 0);
    setLevel(5, 0);
    switchOff(7);
    setLevel(8, 0);
  }

  function disconnect() {
  }

  function tryParse(req) {
    const result = fakeRequestParser.parse(req);

    if (result) {
      emitEvent(result.type, [
        result.node,
        result.value
      ]);
    }
  }

  function logValue(nodeId, commandClass) {
    const value = {label: 'TestLabel', value: 12};

    Logger.info('Node value requested: node %d: %d:%s: %s',
      parseInt(nodeId, 10),
      commandClass,
      value['label'],
      value['value']
    );
  }

  function setLevel(nodeId, level) {
    nodes[nodeId]['level'] = level;
    emitEvent('value changed', [
      nodeId,
      38,
      {
        label: 'level',
        index: 0,
        value: level
      }
    ]);
  }

  function switchOn(nodeId) {
    nodes[nodeId]['value'] = true;
    emitEvent('value changed', [
      nodeId,
      37,
      {
        label: 'Switch',
        index: 0,
        value: true
      }
    ]);
  }

  function switchOff(nodeId) {
    nodes[nodeId]['value'] = false;
    emitEvent('value changed', [
      nodeId,
      37,
      {
        label: 'Switch',
        index: 0,
        value: false
      }
    ]);
  }

  function setValue(nodeId, commandClass, instance, index, value) {
    nodes[nodeId]['value'] = value;
    emitEvent('value changed', [
      nodeId,
      commandClass,
      {
        label: 'Switch',
        index: index,
        value: value
      }
    ]);
  }

  function refreshNodeInfo(nodeid) {
    Logger.info('FAKE: RefreshNodeInfo', nodeid);
  }

  function healNetwork() {
    Logger.info('FAKE: HealNetwork');
  }

  function enablePoll(nodeid, commandClass) {
    Logger.info('FAKE: EnablePoll', nodeid, commandClass);
  }

  function initializeDevices() {
    nodes[2] = {level: 0};
    nodes[3] = {};
    nodes[5] = {level: 0};
    nodes[7] = {value: false};
    nodes[8] = {level: 0};
    nodes[9] = {level: 0};

    const node2NodeInfo = {
      manufacturer: 'Aeon Labs',
      manufacturerid: '0086',
      product: 'Smart Energy Illuminator',
      producttype: '0003',
      productid: '0008',
      type: 'Multilevel Power Switch',
      name: '',
      loc: ''
    };

    // node 3 is never ready, since it is on battery and doesn't listen to events to save power
    // const node3_nodeinfo = {};

    const node5NodeInfo = {
      manufacturer: 'FIBARO System',
      manufacturerid: '010f',
      product: '',
      producttype: '0100',
      productid: '100a',
      type: 'Multilevel Power Switch',
      name: '',
      loc: ''
    };
    const node7NodeInfo = {
      manufacturer: 'Z-Wave.Me',
      manufacturerid: '0115',
      product: 'ZME_054313Z Flush-Mountable Switch',
      producttype: '1000',
      productid: '0001',
      type: 'Binary Power Switch',
      name: '',
      loc: ''
    };

    const node8NodeInfo = {
      manufacturer: 'Z-Wave.Me',
      manufacturerid: '0115',
      product: 'ZME_06433 Wall Flush-Mountable Dimmer',
      producttype: '1000',
      productid: '0002',
      type: 'Multilevel Power Switch',
      name: '',
      loc: ''
    };

    const node9NodeInfo = {
      manufacturer: 'Aeon Labs',
      manufacturerid: '0086',
      product: 'Smart Energy Illuminator',
      producttype: '0003',
      productid: '0008',
      type: 'Multilevel Power Switch',
      name: '',
      loc: ''
    };

    emitEvent('node added', [2]);
    emitEvent('node added', [3]);
    emitEvent('node added', [5]);
    emitEvent('node added', [7]);
    emitEvent('node added', [8]);
    emitEvent('node added', [9]);
    const dimValue = {
      type: 'byte',
      genre: 'user',
      instance: 1,
      index: 0,
      label: 'Level',
      units: '',
      'read_only': false,
      'write_only': false,
      min: 0,
      max: 255,
      value: 0
    };

    const switchValue = {
      type: 'bool',
      genre: 'user',
      instance: 1,
      index: 0,
      label: 'Switch',
      units: '',
      'read_only': false,
      'write_only': false,
      min: 0,
      max: 0,
      value: false
    };

    const standaloneSwitchValue = {
      type: 'byte',
      genre: 'all',
      instance: 1,
      index: 0,
      label: 'Basic',
      units: '',
      'read_only': false,
      'write_only': false,
      min: 0,
      max: 255,
      value: 0
    };

    emitEvent('value added', [
      2,
      SWITCH_MULTILEVEL,
      dimValue
    ]);
    emitEvent('value added', [
      3,
      32,
      standaloneSwitchValue
    ]);
    emitEvent('value added', [
      5,
      SWITCH_MULTILEVEL,
      dimValue
    ]);
    emitEvent('value added', [
      7,
      SWITCH_BINARY,
      switchValue
    ]);
    emitEvent('value added', [
      8,
      SWITCH_MULTILEVEL,
      dimValue
    ]);
    emitEvent('value added', [
      9,
      SWITCH_MULTILEVEL,
      dimValue
    ]);
    emitEvent('node ready', [
      2,
      node2NodeInfo
    ]);
    emitEvent('node ready', [
      5,
      node5NodeInfo
    ]);
    emitEvent('node ready', [
      7,
      node7NodeInfo
    ]);
    emitEvent('node ready', [
      8,
      node8NodeInfo
    ]);
    emitEvent('node ready', [
      9,
      node9NodeInfo
    ]);
    emitEvent('node event', [
      3,
      255
    ]);
    emitEvent('node event', [
      3,
      0
    ]);
  }

  function emitEvent(eventName, params) {
    _.each(callbacks[eventName], function (callback) {
      callback.apply(null, params);
    });
  }

  return {
    on: on,
    connect: connect,
    disconnect: disconnect,
    tryParse: tryParse,
    enablePoll: enablePoll,
    setValue: setValue,
    refreshNodeInfo: refreshNodeInfo,
    healNetwork: healNetwork,
    logValue: logValue
  };
}

module.exports = FakeZWave;
