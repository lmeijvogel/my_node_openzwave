'use strict';

const Node = require('./node');
const _ = require('lodash');
const Logger = require('./logger');

class MyZWave {
  constructor(zwave) {
    this.zwave = zwave;
    this.nodes = [];

    this.eventListeners = {};

    this.scanComplete = false;
  }

  registerEvents() {
    this.zwave.on('driver ready', (homeid) => {
      Logger.verbose('Scanning homeid=0x%s...', homeid.toString(16));
    });

    this.zwave.on('driver failed', () => {
      Logger.fatal('Failed to start driver');
      this.zwave.disconnect();
      process.exit();
    });

    this.zwave.on('node added', (nodeid) => {
      this.addNode(nodeid);
      Logger.verbose('Added node %d', nodeid);
    });

    this.zwave.on('value added', (nodeid, comclass, value) => {
      const node = Node.find(nodeid);

      node.addValue(comclass, value);
    });

    this.zwave.on('value changed', (nodeid, comclass, value) => {
      const node = Node.find(nodeid);

      node.setValue(comclass, value);

      _.each(this.eventListeners['valueChange'], (handler) => {
        handler.call(null, node, comclass, value);
      });
    });

    this.zwave.on('value removed', (nodeid, comclass, index) => {
      const node = Node.find(nodeid);

      node.removeValue(comclass, index);
    });

    this.zwave.on('node ready', (nodeid, nodeinfo) => {
      this.nodeReady(nodeid, nodeinfo);
    });

    this.zwave.on('notification', (nodeid, notif) => {
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

    this.zwave.on('node event', (nodeid, event) => {
      Logger.verbose('node%d: event: %s', nodeid, event);

      const node = Node.find(nodeid);

      _(this.eventListeners['node event']).each((handler) => {
        handler.call(null, node, event);
      });
    });

    this.zwave.on('neighbors', (nodeid, neighbors) => {
      const formattedNeighbors = neighbors.join(', ');

      Logger.info('node%d: neighbors: [ %s ]', nodeid, formattedNeighbors);
    });

    this.zwave.on('scan complete', () => {
      this.scanComplete = true;

      Logger.info('Scan complete, hit ^C to end program.');
    });
  }

  connect() {
    this.registerEvents();
    this.zwave.connect('/dev/ttyUSB0');
  }

  onNodeEvent(handler) {
    if (!this.eventListeners['node event']) {
      this.eventListeners['node event'] = [];
    }
    this.eventListeners['node event'].push(handler);
  }

  onValueChange(handler) {
    if (!this.eventListeners['valueChange']) {
      this.eventListeners['valueChange'] = [];
    }
    this.eventListeners['valueChange'].push(handler);
  }

  addNode(nodeid) {
    Node.add(nodeid);
    this.nodes[nodeid] = {
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

  nodeReady(nodeid, nodeinfo) {
    const node = Node.find(nodeid);

    node.setNodeInfo(nodeinfo);
    node.setReady();
    Logger.debug('Node ready, node: %s', node);
    if (node.isPollable()) {
      Logger.debug('.. enabling poll');
      this.enablePoll(node);
    }
  }

  enablePoll(node) {
    Logger.info('Not enabling polling: I don\'t know what instance/index should be polled.');

    return;

    _(node.pollableClasses()).each((commandClass) => {
      this.zwave.enablePoll(node.nodeId, commandClass);
    });
  }

  setLevel(nodeid, level) {
    if (this.scanComplete) {
      this.zwave.setValue(nodeid, 38, 1, 0, level);
    } else {
      Logger.info('Not setting level: Initial scan not yet completed.');
    }
  }

  switchOn(nodeid) {
    if (this.scanComplete) {
      this.zwave.setValue(nodeid, 37, 1, 0, true);
    } else {
      Logger.info('Not switching on: Initial scan not yet completed.');
    }
  }

  switchOff(nodeid) {
    if (this.scanComplete) {
      this.zwave.setValue(nodeid, 37, 1, 0, false);
    } else {
      Logger.info('Not switching off: Initial scan not yet completed.');
    }
  }

  healNetwork() {
    this.zwave.healNetwork();
  }
}

module.exports = MyZWave;
