'use strict';

const util = require('util');
const _ = require('lodash');
const Logger = require('./logger');

const nodes = {};

const POLLABLE_CLASSES = [ 0x25, 0x26 ];

function Node(nodeId) {
  let values = {};
  let info = {};
  let ready = null;

  function addValue(commandClass, value) {
    if (!commandClassExists(commandClass)) {
      values[commandClass] = [];
    }

    values[commandClass][value.index] = value;
  }

  function setValue(commandClass, value) {
    if (!commandClassExists(commandClass)) {
      throw 'Command class "' +  commandClass  + '" was never added to this node (' +  nodeId  + ')';
    }

    if (getValue(commandClass, value.index).value !== value.value) {
      if (isReady()) {
        if (commandClass === 38 || commandClass === 37) {
          Logger.info('Received node change: node %d: %s => %s', nodeId, value['label'], value['value']);
        } else {
          Logger.verbose('Received node change: node %d: %d:%s:%s => %s',
            nodeId, commandClass, value['label'], getValue(commandClass, value.index)['value'], value['value']);
        }
      } else {
        Logger.debug('Received node change: node %d: %d:%s:%s => %s (before nodeReady event)',
          nodeId, commandClass, value['label'], getValue(commandClass, value.index)['value'], value['value']);
      }

      values[commandClass][value.index] = value;
    }
  }

  function getValue(commandClass, index) {
    if (commandClassExists(commandClass)) {
      return values[commandClass][index];
    } else {
      return {label: 'Unknown', value: '-'};
    }
  }

  function commandClassExists(commandClass) {
    return !!values[commandClass];
  }

  function removeValue(commandClass, index) {
    if (commandClassExists(commandClass) && values[commandClass][index]) {
      delete values[commandClass][index];
    }
  }

  function setReady() {
    ready = true;
  }

  function isReady() {
    return ready;
  }

  function setNodeInfo(nodeInfo) {
    info['manufacturer'] = nodeInfo.manufacturer;
    info['manufacturerid'] = nodeInfo.manufacturerid;
    info['product'] = nodeInfo.product;
    info['producttype'] = nodeInfo.producttype;
    info['productid'] = nodeInfo.productid;
    info['type'] = nodeInfo.type;
    info['name'] = nodeInfo.name;
    info['loc'] = nodeInfo.loc;
  }

  function toString() {
    let result = '';

    _.forIn(values, function (commandClass, commandClassIdx) {
      result += util.format('node%d: class %d\n', nodeId, commandClassIdx);

      _.forIn(commandClass, function (command) {
        result += util.format('node%d:   %s=%s', nodeId, command['label'], command['value']);
      });
    });

    return result;
  }

  function isPollable() {
    return _.some(pollableClasses());
  }

  function pollableClasses() {
    const keys = _.keys(values);

    return _.filter(keys, function (commandClassIdx) {
      const intCommandClassIdx = parseInt(commandClassIdx, 10);

      // 0x25: COMMAND_CLASS_SWITCH_BINARY
      // 0x26: COMMAND_CLASS_SWITCH_MULTILEVEL
      return _.includes(POLLABLE_CLASSES, intCommandClassIdx);
    });
  }

  return {
    nodeId:          nodeId,
    addValue:        addValue,
    setValue:        setValue,
    getValue:        getValue,
    removeValue:     removeValue,
    setReady:        setReady,
    isReady:         isReady,
    setNodeInfo:     setNodeInfo,
    toString:        toString,
    isPollable:      isPollable,
    pollableClasses: pollableClasses
  };
}

Node.find = function (nodeid) {
  return nodes[parseInt(nodeid, 10)];
};

Node.all = function () {
  return _.extend({}, nodes);
};

Node.add = function (nodeid) {
  nodes[nodeid] = new Node(nodeid);
};

module.exports = Node;
