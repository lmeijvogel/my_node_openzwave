var util = require("util");
var _ = require("lodash");

var nodes = {};

var POLLABLE_CLASSES = [ 0x25, 0x26 ];

function Node(nodeId) {
  var values = {};
  var info = {};
  var ready = null;

  function addValue(commandClass, value) {
    if (!commandClassExists(commandClass)) {
      values[commandClass] = [];
    }

    setValue(commandClass, value);
  }

  function setValue(commandClass, value) {
    values[commandClass][value.index] = value;
  }

  function getValue(commandClass, index) {
    if (commandClassExists(commandClass)) {
      return values[commandClass][index];
    }
    else {
      return {label: "Unknown", value: "-"};
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
    info["manufacturer"] = nodeInfo.manufacturer;
    info["manufacturerid"] = nodeInfo.manufacturerid;
    info["product"] = nodeInfo.product;
    info["producttype"] = nodeInfo.producttype;
    info["productid"] = nodeInfo.productid;
    info["type"] = nodeInfo.type;
    info["name"] = nodeInfo.name;
    info["loc"] = nodeInfo.loc;
  }

  function toString() {
    var result = "";

    _.forIn(values, function(commandClass, commandClassIdx) {
      result += util.format("node%d: class %d\n", nodeId, commandClassIdx);

      _.forIn(commandClass, function(command) {
        result += util.format("node%d:   %s=%s", nodeId, command["label"], command["value"])
      });
    });

    return result;
  }

  function isPollable() {
    return _.any(pollableClasses());
  }

  function pollableClasses() {
    var keys = _.keys(values);

    return _.select(keys, function (commandClassIdx) {
      var commandClass = values[commandClassIdx];
      var intCommandClassIdx = parseInt(commandClassIdx, 10);

      // 0x25: COMMAND_CLASS_SWITCH_BINARY
      // 0x26: COMMAND_CLASS_SWITCH_MULTILEVEL
      return _.contains(POLLABLE_CLASSES, intCommandClassIdx);
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
  }
}

Node.find = function (nodeid) {
  return nodes[parseInt(nodeid, 10)];
};

Node.all = function() {
  return _.extend({}, nodes);
}

Node.add = function (nodeid) {
  nodes[nodeid] = new Node(nodeid);
}

module.exports = Node;
