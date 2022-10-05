import * as util from "util";
import { extend, filter, forIn, includes, keys as _keys, map, some } from "lodash";
import { Logger } from "./Logger";

const nodes = new Map<number, Node>();

// 0x25: COMMAND_CLASS_SWITCH_BINARY
// 0x26: COMMAND_CLASS_SWITCH_MULTILEVEL
const POLLABLE_CLASSES = [0x25, 0x26];

// Copied from openzwave-shared.d.ts, since I can't seem to import it correctly.
interface ValueId {
  value_id?: number;
  node_id: number;
  class_id: number;
  instance: number;
  index: number;
  label?: string;
}

class Node {
  nodeId: number;
  values: Object;
  info: Object;
  ready: boolean;

  static find(nodeid): Node {
    return nodes.get(parseInt(nodeid, 10));
  }

  static all(): {} {
    return extend({}, nodes);
  }

  static add(nodeid) {
    nodes.set(nodeid, new Node(nodeid));
  }

  constructor(nodeId) {
    this.nodeId = nodeId;
    this.values = {};
    this.info = {};
    this.ready = false;
  }

  addValue(commandClass: number, value: ValueId) {
    if (!this.commandClassExists(commandClass)) {
      this.values[commandClass] = [];
    }

    this.values[commandClass][value.index] = value;
  }

  setValue(commandClass: number, value) {
    if (!this.commandClassExists(commandClass)) {
      throw 'Command class "' + commandClass + '" was never added to this node (' + this.nodeId + ")";
    }

    if (this.getValue(commandClass, value.index).value !== value.value) {
      if (this.isReady()) {
        if (commandClass === 38 || commandClass === 37) {
          Logger.info(`Received node change: node ${this.nodeId}: ${value["label"]} => ${value["value"]}`);
        } else {
          Logger.verbose(
            `Received node change: ${this.nodeId}: ${commandClass}:${value["label"]}:${
            this.getValue(commandClass, value.index)["value"]
            } => ${value["value"]}`
          );
        }
      } else {
        Logger.debug(
          `Received node change: ${this.nodeId}: ${commandClass}:${value["label"]}:${
          this.getValue(commandClass, value.index)["value"]
          } => ${value["value"]} (before nodeReady event)`
        );
      }

      this.values[commandClass][value.index] = value;
    }
  }

  getValue(commandClass: number, index) {
    if (this.commandClassExists(commandClass)) {
      return this.values[commandClass][index];
    } else {
      return { label: "Unknown", value: "-" };
    }
  }

  commandClassExists(commandClass: number) {
    return !!this.values[commandClass];
  }

  removeValue(commandClass: number, index) {
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
    this.info["manufacturer"] = nodeInfo.manufacturer;
    this.info["manufacturerid"] = nodeInfo.manufacturerid;
    this.info["product"] = nodeInfo.product;
    this.info["producttype"] = nodeInfo.producttype;
    this.info["productid"] = nodeInfo.productid;
    this.info["type"] = nodeInfo.type;
    this.info["name"] = nodeInfo.name;
    this.info["loc"] = nodeInfo.loc;
  }

  toString() {
    let result = "";

    forIn(this.values, (commandClass, commandClassIdx) => {
      result += util.format("node%d: class %d\n", this.nodeId, commandClassIdx);

      if (commandClass) {
        forIn(commandClass, command => {
          if (command) {
            result += util.format("node%d:   %s=%s", this.nodeId, command["label"], command["value"]);
          } else {
            Logger.error(`Unexpected null value in 'command' for Node '${this.nodeId}', commandClassIndex ${commandClassIdx}.`);
          }
        });
      } else {
        Logger.error(`Unexpected null value in 'commandClass' for Node '${this.nodeId}', commandClassIndex ${commandClassIdx}.`);
      }
    });

    return result;
  }

  isPollable() {
    return some(this.pollableClasses());
  }

  pollableClasses(): number[] {
    const keys = _keys(this.values);

    const numericKeys = map(keys, commandClassIdx => parseInt(commandClassIdx, 10));

    return filter(numericKeys, function(commandClass) {
      return includes(POLLABLE_CLASSES, commandClass);
    });
  }
}

export { Node, ValueId };
