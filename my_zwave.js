'use strict';

const MESSAGE_COMPLETE = 0;
const TIMEOUT = 1;
const NOP = 2;
const NODE_AWAKE = 3;
const NODE_SLEEP = 4;
const NODE_DEAD = 5;
const NODE_ALIVE = 6;

const Node = require('./node');
const _ = require('lodash');
const Logger = require('./logger');

function MyZWave(zwave) {
  let nodes = [];
  let eventListeners = {};

  let scanComplete = false;

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
      const node = Node.find(nodeid);

      node.addValue(comclass, value);
    });

    zwave.on('value changed', function (nodeid, comclass, value) {
      const node = Node.find(nodeid);

      node.setValue(comclass, value);

      _.each(eventListeners['valueChange'], function (handler) {
        handler.call(null, node, comclass, value);
      });
    });

    zwave.on('value removed', function (nodeid, comclass, index) {
      const node = Node.find(nodeid);

      node.removeValue(comclass, index);
    });

    zwave.on('node ready', function (nodeid, nodeinfo) {
      nodeReady(nodeid, nodeinfo);
    });

    zwave.on('notification', function (nodeid, notif) {
      switch(notif) {
      case MESSAGE_COMPLETE:
        Logger.info('node%d: message complete', nodeid);
        break;
      case TIMEOUT:
        Logger.warn('node%d: timeout', nodeid);
        break;
      case NOP:
        Logger.info('node%d: nop', nodeid);
        break;
      case NODE_AWAKE:
        Logger.info('node%d: node awake', nodeid);
        break;
      case NODE_SLEEP:
        Logger.info('node%d: node sleep', nodeid);
        break;
      case NODE_DEAD:
        Logger.warn('node%d: node dead', nodeid);
        break;
      case NODE_ALIVE:
        Logger.info('node%d: node alive', nodeid);
        break;
      default:
        Logger.info('node%d: unexpected message (nothing serious)', nodeid);
        break;
      }
    });

    zwave.on('node event', function (nodeid, event) {
      Logger.verbose('node%d: event: %s', nodeid, event);

      const node = Node.find(nodeid);

      _(eventListeners['node event']).each(function (handler) {
        handler.call(null, node, event);
      });
    });

    zwave.on('neighbors', function (nodeid, neighbors) {
      const formattedNeighbors = neighbors.join(', ');

      Logger.info('node%d: neighbors: [ %s ]', nodeid, formattedNeighbors);
    });

    zwave.on('scan complete', function () {
      scanComplete = true;

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
    const node = Node.find(nodeid);

    node.setNodeInfo(nodeinfo);
    node.setReady();
    Logger.debug('Node ready, node: %s', node);
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
    if (scanComplete) {
      zwave.setValue(nodeid, 38, 1, 0, level);
    } else {
      Logger.info('Not setting level: Initial scan not yet completed.');
    }
  }

  function switchOn(nodeid) {
    if (scanComplete) {
      zwave.setValue(nodeid, 37, 1, 0, true);
    } else {
      Logger.info('Not switching on: Initial scan not yet completed.');
    }
  }

  function switchOff(nodeid) {
    if (scanComplete) {
      zwave.setValue(nodeid, 37, 1, 0, false);
    } else {
      Logger.info('Not switching off: Initial scan not yet completed.');
    }
  }

  function getNeighbors(nodeid) {
    zwave.getNeighbors(nodeid);
  }

  function logValue(nodeId, commandClass, index) {
    const node = Node.find(nodeId);
    const value = node.getValue(commandClass, index);

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
