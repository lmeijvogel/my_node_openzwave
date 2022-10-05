import { each, map } from "lodash";
import { Logger, mapToString } from "./logger";
import { Light } from "./light";

class Action {
  public readonly nodeName: string;
  public readonly nodeid: number;
  public readonly value: any;

  constructor(nodeName: string, nodeId: number, value: any) {
    this.nodeName = nodeName;
    this.nodeid = nodeId;
    this.value = value;
  }
}

interface IProgramme {
  readonly name: string;
  apply(zwave): void;
}

class Programme implements IProgramme {
  public readonly name: string;

  public readonly displayName: string;
  public readonly actions: Action[];

  constructor(name: string, displayName: string, data: Map<string, object>, lights: Map<string, Light>) {
    this.name = name;
    this.displayName = displayName;
    this.actions = [];

    Logger.debug(`Programme.constructor: Creating node with data: ${[...data]}, lights: ${[...lights]}`);
    data.forEach((value, key) => {
      const light = lights.get(key);

      if (!light) {
        throw new Error(`Error creating Programme "${this.name}": node "${key}" does not exist`);
      }

      const action = new Action(key, light.id, value);
      this.actions.push(action);
    });
  }

  apply(zwave): void {
    this.actions.forEach(action => {
      try {
        if (action.value === true) {
          Logger.verbose(`Send command "switch on" to node ${action.nodeid}`);
          zwave.switchOn(action.nodeid);
        } else if (action.value === false) {
          Logger.verbose(`Send command "switch off" to node ${action.nodeid}`);
          zwave.switchOff(action.nodeid);
        } else {
          Logger.verbose(`Send command "level ${action.value}" to node ${action.nodeid}`);
          zwave.setLevel(action.nodeid, action.value);
        }
      } catch (e) {
        Logger.error(`ERROR in programme "${this.name}": Could not switch node "${action.nodeName}"`);
        Logger.error(e.toString());
      }
    });
  }
}

export { Programme };
export { IProgramme };
