var classy = require('classy');
var util = require('util');

var _ = require('lodash');

var nodes = {}

var Node = classy.define({
  init: function(nodeId) {
    this.nodeId = nodeId;

    this.values = {};
    this.info   = {};
  },

  addValue: function(commandClass, value) {
    if (!this.values[commandClass]) {
      this.values[commandClass] = [];
    }

    this.setValue(commandClass, value);
  },

  setValue: function(commandClass, value) {
    this.values[commandClass][value.index] = value;
  },

  getValue: function(commandClass, index) {
    return this.values[commandClass][index];
  },

  removeValue: function(commandClass, index) {
    if (this.values[commandClass] &&
        this.values[commandClass][index]) {
      delete this.values[commandClass][index];
    }
  },

  setReady: function() {
    this.ready = true;
  },

  isReady: function() {
    return this.ready;
  },

  setNodeInfo: function(nodeInfo) {
    this.info['manufacturer'] = nodeInfo.manufacturer;
    this.info['manufacturerid'] = nodeInfo.manufacturerid;
    this.info['product'] = nodeInfo.product;
    this.info['producttype'] = nodeInfo.producttype;
    this.info['productid'] = nodeInfo.productid;
    this.info['type'] = nodeInfo.type;
    this.info['name'] = nodeInfo.name;
    this.info['loc'] = nodeInfo.loc;
  },

  toString: function() {
    var result = "";
    for (commandClassIdx in this.values) {
      var commandClass = this.values[commandClassIdx];

      result += util.format('node%d: class %d\n', this.nodeId, commandClassIdx);

      for (idx in commandClass) {
        var command = commandClass[idx];
        result += util.format('node%d:   %s=%s', this.nodeId, command['label'], command['value']);
      }
    }

    return result;
  },

  isPollable: function() {
    return _(this.pollableClasses()).any();
  },

  pollableClasses: function() {
    for (commandClassIdx in this.values) {
      var commandClass = this.values[commandClassIdx];
      switch (commandClassIdx) {
        case 0x25: // COMMAND_CLASS_SWITCH_BINARY
        case 0x26: // COMMAND_CLASS_SWITCH_MULTILEVEL
          zwave.enablePoll(nodeid, comclass);
          break;
      }
    }
  }
});

Node.find = function(nodeid) {
  return nodes[parseInt(nodeid, 10)];
};

Node.all = function() {
  return nodes;//_.compact(nodes);
};

Node.add = function(nodeid) {
  nodes[nodeid] = new Node(nodeid);
};

module.exports = Node;
