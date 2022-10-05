import { Logger } from "./Logger";
import { ConfigLight } from "./ConfigLight";
import { IMyZWave } from "./IMyZWave";

export class Action {
  constructor(readonly nodeName: string, readonly nodeId: number, readonly value: any) {}
}

export interface IProgramme {
  readonly name: string;
  apply(zwave: IMyZWave): void;
}

/* This does not need reloading because it will be replaced on reload:
 * otherwise I can't easily account for disappearing and new programmes.
 */
export class Programme implements IProgramme {
  public readonly actions: Action[];

  constructor(readonly name: string, readonly displayName: string, data: Map<string, object>, lights: ConfigLight[]) {
    Logger.debug(`Programme.constructor: Creating node with data: ${[...data]}, lights: ${[...lights]}`);

    this.actions = this.buildActions(data, lights, name);
  }

  apply(zwave: IMyZWave): void {
    this.actions.forEach(action => {
      try {
        if (action.value === true) {
          Logger.verbose(`Send command "switch on" to node ${action.nodeId}`);
          zwave.switchOn(action.nodeId);
        } else if (action.value === false) {
          Logger.verbose(`Send command "switch off" to node ${action.nodeId}`);
          zwave.switchOff(action.nodeId);
        } else {
          Logger.verbose(`Send command "level ${action.value}" to node ${action.nodeId}`);
          zwave.setLevel(action.nodeId, action.value);
        }
      } catch (e) {
        Logger.error(`ERROR in programme "${this.name}": Could not switch node "${action.nodeName}"`);
        Logger.error(e.toString());
      }
    });
  }

  private buildActions(data: Map<string, object>, lights: ConfigLight[], name: string): Action[] {
    const result: Action[] = [];

    data.forEach((value, key) => {
      const light = lights.find(l => l.name === key);

      if (!light) {
        throw new Error(`Error creating Programme "${name}": node "${key}" does not exist`);
      }

      const action = new Action(key, light.id, value);
      result.push(action);
    });

    return result;
  }
}
