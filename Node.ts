import { extend, map, without } from "lodash";
import { Logger } from "./Logger";

const nodes = new Map<number, Node>();

const COMMAND_CLASS_SWITCH_BINARY = 0x25;
const COMMAND_CLASS_SWITCH_MULTILEVEL = 0x26;

const POLLABLE_CLASSES = [COMMAND_CLASS_SWITCH_BINARY, COMMAND_CLASS_SWITCH_MULTILEVEL];

// Copied from openzwave-shared.d.ts, since I can't seem to import it correctly.
interface ValueId {
  value_id?: number;
  value?: string;
  node_id: number;
  class_id: number;
  instance: number;
  index: number;
  label?: string;
}

class Node {
  nodeId: number;
  values: Map<number, ValueId[]>;
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
    this.values = new Map<number, ValueId[]>();
    this.info = {};
    this.ready = false;
  }

  addValue(commandClass: number, value: ValueId) {
    if (!this.commandClassExists(commandClass)) {
      this.values.set(commandClass, []);
    }

    this.values.get(commandClass)[value.index] = value;
  }

  setValue(commandClass: number, value) {
    if (!this.commandClassExists(commandClass)) {
      throw 'Command class "' + commandClass + '" was never added to this node (' + this.nodeId + ")";
    }

    if (this.getValue(commandClass, value.index).value !== value.value) {
      if (this.isReady()) {
        if (commandClass === 38 || commandClass === 37) {
          Logger.info(`Received node change: node ${this.nodeId}: ${value["label"]} => ${value["value"]}`);
        } else if (commandClass === 43) {
            const previousScene = this.getValue(commandClass, value.index)["value"];
            const newScene = value.value;

            if (newScene === 0) {
                // Do not log scene return to 0 since this adds no value at the moment
                return;
            }
            Logger.info(`Received scene change: node ${this.nodeId}: Scene: ${previousScene} => ${newScene}`);

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

      this.values.get(commandClass)[value.index] = value;
    }
  }

  getValue(commandClass: number, index) {
    if (this.commandClassExists(commandClass)) {
      return this.values.get(commandClass)[index];
    } else {
      return { label: "Unknown", value: "-" };
    }
  }

  commandClassExists(commandClass: number) {
    return this.values.has(commandClass);
  }

  removeValue(commandClass: number, index) {
    if (this.commandClassExists(commandClass)) {
      const filteredCommandClass = without(this.values[commandClass], index);

      this.values.set(commandClass, filteredCommandClass);
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
    let result = `node ${this.nodeId}: (`;

    this.values.forEach((commandClass, commandClassIdx) => {
      result += `class ${commandClassIdx}: {`;

      if (commandClass) {
        result += commandClass.map(command => {
          if (command) {
            return `${command.label}=${command.value}`;
          }
        }).filter(el => !!el).join(", ");
      }

      result += "}";
    });

    result += ")";

    return result;
  }

  isPollable() {
    return this.pollableClasses().length > 0;
  }

  pollableClasses(): number[] {
    const keys = this.values.keys;

    const numericKeys = map(keys, commandClassIdx => parseInt(commandClassIdx, 10));

    return numericKeys.filter(commandClass => POLLABLE_CLASSES.includes(commandClass));
  }
}

export { Node, ValueId };
