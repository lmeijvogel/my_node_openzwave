import { map } from "lodash";
import { Logger } from "./Logger";
import { ValueId } from "./ValueId";

const nodes = new Map<number, Node>();

const COMMAND_CLASS_SWITCH_BINARY = 0x25;
const COMMAND_CLASS_SWITCH_MULTILEVEL = 0x26;

const POLLABLE_CLASSES = [COMMAND_CLASS_SWITCH_BINARY, COMMAND_CLASS_SWITCH_MULTILEVEL];

export class Node {
  readonly values: Map<number, ValueId[]>;

  private isReady: boolean = false;

  static find(nodeId: number): Node {
    // TODO: Exclamation point?
    return nodes.get(nodeId)!;
  }

  static all(): {} {
    return [...nodes];
  }

  static add(nodeId: number) {
    nodes.set(nodeId, new Node(nodeId));
  }

  constructor(readonly nodeId: number) {
    this.values = new Map<number, ValueId[]>();
  }

  addValue(commandClass: number, value: ValueId) {
    if (!this.getValues(commandClass)) {
      this.values.set(commandClass, []);
    }

    this.values.get(commandClass)![value.index] = value;
  }

  setValue(commandClass: number, value: ValueId) {
    if (!this.getValues(commandClass)) {
      throw 'Command class "' + commandClass + '" was never added to this node (' + this.nodeId + ")";
    }

    if (this.getValue(commandClass, value.index).value !== value.value) {
      if (this.isReady) {
        if (commandClass === 38 || commandClass === 37) {
          Logger.info(`Received node change: node ${this.nodeId}: ${value["label"]} => ${value["value"]}`);
        } else if (commandClass === 43) {
            const previousScene = this.getValue(commandClass, value.index)["value"];
            const newScene = value.value;

            if (newScene === "0") {
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

      this.values.get(commandClass)![value.index] = value;
    }
  }

  getValue(commandClass: number, index: number) {
    const commandClassValues = this.values.get(commandClass);

    if (commandClassValues) {
      return commandClassValues[index];
    } else {
      return { label: "Unknown", value: "-" };
    }
  }

  removeValue(commandClass: number, index: number) {
    const commandClassValues = this.getValues(commandClass);

    if (commandClassValues) {
      const newCommandClassValues = [...commandClassValues];
      newCommandClassValues.splice(index, 1);

      this.values.set(commandClass, newCommandClassValues);
    }
  }

  getValues(commandClass: number): ValueId[] | undefined {
    return this.values.get(commandClass);
  }

  setReady() {
    this.isReady = true;
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
