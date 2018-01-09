import { each, map } from 'lodash';
import Logger from './logger';
import Light from './light';

class Action {
  public readonly nodeName : string;
  public readonly nodeid : number;
  public readonly value : any;

  constructor(nodeName, nodeId, value) {
    this.nodeName = nodeName;
    this.nodeid = nodeId;
    this.value = value;
  }
}

class Programme {
  public readonly name : String;

  private readonly displayName : String;
  private readonly actions: Action[];

  constructor(name, displayName, data, lights : Map<string, Light>) {
    this.name = name;
    this.displayName = displayName;

    this.actions = map(data, (value, key) => {
      if (!lights[key]) {
        throw 'Error creating Programme "' + this.name + '": node "' + key + '" does not exist';
      }

      return new Action(key, lights[key].id, value);
    });

  }

  apply(zwave) : void {
    each(this.actions, (action) => {
      try {
        if (action.value === true) {
          Logger.verbose('Send command "switch on" to node %d', action.nodeid);
          zwave.switchOn(action.nodeid);
        } else if (action.value === false) {
          Logger.verbose('Send command "switch off" to node %d', action.nodeid);
          zwave.switchOff(action.nodeid);
        } else {
          Logger.verbose('Send command "level %d" to node %d', action.value, action.nodeid);
          zwave.setLevel(action.nodeid, action.value);
        }
      } catch(e) {
        Logger.error('ERROR in programme "' + this.name + '": Could not switch node "' + action.nodeName + '"');
        Logger.error(e.toString());
      }
    });
  }
}

export default Programme;
