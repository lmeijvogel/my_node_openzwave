import { each, map } from 'lodash';
import Logger from './logger';

class Programme {
  private readonly name : String;
  private readonly displayName : String;
  private readonly actions: any[];

  constructor(name, displayName, data, lights) {
    this.name = name;
    this.displayName = displayName;

    this.actions = map(data, (value, key) => {
      if (!lights[key]) {
        throw 'Error creating Programme "' + this.name + '": node "' + key + '" does not exist';
      }

      return {
        nodeName: key,
        nodeid: lights[key].id,
        value: value
      };
    });

  }

  apply(zwave) {
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
