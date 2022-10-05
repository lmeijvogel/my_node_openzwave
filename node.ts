import * as util from 'util';
import { extend, filter, forIn, includes, keys as _keys, some } from 'lodash';
import { Logger } from './logger';

const nodes = {};

const POLLABLE_CLASSES = [ 0x25, 0x26 ];

class Node {
  nodeId : number;
  values : Object;
  info: Object;
  ready: boolean;

  static find(nodeid) {
    return nodes[parseInt(nodeid, 10)];
  };

  static all() {
    return extend({}, nodes);
  };

  static add(nodeid) {
    nodes[nodeid] = new Node(nodeid);
  };

  constructor(nodeId) {
    this.nodeId = nodeId;
    this.values = {};
    this.info = {};
    this.ready = false;
  }

  addValue(commandClass, value) {
    if (!this.commandClassExists(commandClass)) {
      this.values[commandClass] = [];
    }

    this.values[commandClass][value.index] = value;
  }

  setValue(commandClass, value) {
    if (!this.commandClassExists(commandClass)) {
      throw 'Command class "' +  commandClass  + '" was never added to this node (' +  this.nodeId  + ')';
    }

    if (this.getValue(commandClass, value.index).value !== value.value) {
      if (this.isReady()) {
        if (commandClass === 38 || commandClass === 37) {
          Logger.info('Received node change: node %d: %s => %s', this.nodeId, value['label'], value['value']);
        } else {
          Logger.verbose('Received node change: node %d: %d:%s:%s => %s',
            this.nodeId, commandClass, value['label'], this.getValue(commandClass, value.index)['value'], value['value']);
        }
      } else {
        Logger.debug('Received node change: node %d: %d:%s:%s => %s (before nodeReady event)',
          this.nodeId, commandClass, value['label'], this.getValue(commandClass, value.index)['value'], value['value']);
      }

      this.values[commandClass][value.index] = value;
    }
  }

  getValue(commandClass, index) {
    if (this.commandClassExists(commandClass)) {
      return this.values[commandClass][index];
    } else {
      return {label: 'Unknown', value: '-'};
    }
  }

  commandClassExists(commandClass) {
    return !!this.values[commandClass];
  }

  removeValue(commandClass, index) {
    if (this.commandClassExists(commandClass) && this.values[commandClass][index]) {
      delete this.values[commandClass][index];
    }
  }

  setReady() {
    this.ready = true;
  }

  isReady() {
    return this.ready;
  }

  setNodeInfo(nodeInfo) {
    this.info['manufacturer'] = nodeInfo.manufacturer;
    this.info['manufacturerid'] = nodeInfo.manufacturerid;
    this.info['product'] = nodeInfo.product;
    this.info['producttype'] = nodeInfo.producttype;
    this.info['productid'] = nodeInfo.productid;
    this.info['type'] = nodeInfo.type;
    this.info['name'] = nodeInfo.name;
    this.info['loc'] = nodeInfo.loc;
  }

  toString() {
    let result = '';

    forIn(this.values, (commandClass, commandClassIdx) => {
      result += util.format('node%d: class %d\n', this.nodeId, commandClassIdx);

      forIn(commandClass, (command) => {
        result += util.format('node%d:   %s=%s', this.nodeId, command['label'], command['value']);
      });
    });

    return result;
  }

  isPollable() {
    return some(this.pollableClasses());
  }

  pollableClasses() {
    const keys = _keys(this.values);

    return filter(keys, function (commandClassIdx) {
      const intCommandClassIdx = parseInt(commandClassIdx, 10);

      // 0x25: COMMAND_CLASS_SWITCH_BINARY
      // 0x26: COMMAND_CLASS_SWITCH_MULTILEVEL
      return includes(POLLABLE_CLASSES, intCommandClassIdx);
    });
  }
}

export { Node };
