'use strict';

var Node = require('./node');
var _ = require('lodash');
var Logger = require('./logger');

function MyZWave(zwave) {
  var nodes = [];
  var eventListeners = {};

  function registerEvents() {
    zwave.on('driver ready', function (homeid) {
      Logger.verbose('Scanning homeid=0x%s...', homeid.toString(16));
    });

    zwave.on('driver failed', function () {
      Logger.fatal('Failed to start driver');
      zwave.disconnect();
      process.exit();
    });

    zwave.on('node added', function (nodeid) {
      addNode(nodeid);
      Logger.verbose('Added node %d', nodeid);
    });

    zwave.on('value added', function (nodeid, comclass, value) {
      var node = Node.find(nodeid);

      node.addValue(comclass, value);
    });

    zwave.on('value changed', function (nodeid, comclass, value) {
      var node = Node.find(nodeid);

      if (node.isReady()) {
        if (comclass === 38 || comclass === 37) {
          Logger.info('Received node change: node %d: %s => %s', nodeid, value['label'], value['value']);
        } else {
          Logger.verbose('Received node change: node %d: %d:%s:%s => %s',
            nodeid, comclass, value['label'], node.getValue(comclass, value.index)['value'], value['value']);
        }
      } else {
        Logger.debug('Received node change: node %d: %d:%s:%s => %s (before nodeReady event)',
          nodeid, comclass, value['label'], node.getValue(comclass, value.index)['value'], value['value']);
      }

      node.setValue(comclass, value);

      _.each(eventListeners['valueChange'], function (handler) {
        handler.call(null, node, comclass, value);
      });
    });

    zwave.on('value removed', function (nodeid, comclass, index) {
      var node = Node.find(nodeid);

      node.removeValue(comclass, index);
    });

    zwave.on('node ready', function (nodeid, nodeinfo) {
      nodeReady(nodeid, nodeinfo);
    });

    zwave.on('notification', function (nodeid, notif) {
      switch(notif) {
      case 0:
        Logger.info('node%d: message complete', nodeid);
        break;
      case 1:
        Logger.warn('node%d: timeout', nodeid);
        break;
      case 2:
        Logger.info('node%d: nop', nodeid);
        break;
      case 3:
        Logger.info('node%d: node awake', nodeid);
        break;
      case 4:
        Logger.info('node%d: node sleep', nodeid);
        break;
      case 5:
        Logger.warn('node%d: node dead', nodeid);
        break;
      case 6:
        Logger.info('node%d: node alive', nodeid);
        break;
      default:
        Logger.info('node%d: unexpected message (nothing serious)', nodeid);
        break;
      }
    });

    zwave.on('node event', function (nodeid, event) {
      Logger.verbose('node%d: event: %s', nodeid, event);

      var node = Node.find(nodeid);

      _(eventListeners['node event']).each(function (handler) {
        handler.call(null, node, event);
      });
    });

    zwave.on('neighbors', function (nodeid, neighbors) {
      var formattedNeighbors = neighbors.join(', ');

      Logger.info('node%d: neighbors: [ %s ]', nodeid, formattedNeighbors);
    });

    zwave.on('scan complete', function () {
      Logger.info('Scan complete, hit ^C to end program.');
    });
  }

  function connect() {
    registerEvents();
    zwave.connect('/dev/ttyUSB0');
  }

  function onNodeEvent(handler) {
    if (!eventListeners['node event']) {
      eventListeners['node event'] = [];
    }
    eventListeners['node event'].push(handler);
  }

  function onValueChange(handler) {
    if (!eventListeners['valueChange']) {
      eventListeners['valueChange'] = [];
    }
    eventListeners['valueChange'].push(handler);
  }

  function addNode(nodeid) {
    Node.add(nodeid);
    nodes[nodeid] = {
      manufacturer: '',
      manufacturerid: '',
      product: '',
      producttype: '',
      productid: '',
      type: '',
      name: '',
      loc: '',
      classes: {},
      ready: false
    };
  }

  function nodeReady(nodeid, nodeinfo) {
    var node = Node.find(nodeid);

    node.setNodeInfo(nodeinfo);
    node.setReady();
    Logger.debug('Node ready, node: %s', node.toString());
    if (node.isPollable()) {
      Logger.debug('.. enabling poll');
      enablePoll(node);
    }
  }

  function enablePoll(node) {
    _(node.pollableClasses()).each(function (commandClass) {
      zwave.enablePoll(node.nodeId, commandClass);
    });
  }

  function setLevel(nodeid, level) {
    zwave.setValue(nodeid, 38, 1, 0, level);
  }

  function switchOn(nodeid) {
    zwave.setValue(nodeid, 37, 1, 0, true);
  }

  function switchOff(nodeid) {
    zwave.setValue(nodeid, 37, 1, 0, false);
  }

  function getNeighbors(nodeid) {
    zwave.getNeighbors(nodeid);
  }

  function logValue(nodeId, commandClass, index) {
    var node = Node.find(nodeId);
    var value = node.getValue(commandClass, index);

    Logger.info('Node value requested: node %d: %d:%s: %s', nodeId, commandClass, value['label'], value['value']);
  }

  function healNetwork() {
    zwave.healNetwork();
  }

  return {
    connect:       connect,
    onNodeEvent:   onNodeEvent,
    onValueChange: onValueChange,
    enablePoll:    enablePoll,
    setLevel:      setLevel,
    switchOn:      switchOn,
    switchOff:     switchOff,
    getNeighbors:  getNeighbors,
    logValue:      logValue,
    healNetwork:   healNetwork
  };
}

module.exports = MyZWave;
