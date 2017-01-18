'use strict';

const _ = require('lodash');
const Logger = require('./logger');

function Programme(name, displayName, lightValues, lights) {
  const actions = _(lightValues).map(function (value, nodeName) {
    if (!lights[nodeName]) {
      throw 'Error creating Programme "' + name + '": node "' + nodeName + '" does not exist';
    }

    return {
      nodeName: nodeName,
      nodeid: lights[nodeName].id,
      value: value
    };
  }).value();

  function apply(zwave) {
    _.each(actions, function (action) {
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
        Logger.error('ERROR in programme "' + name + '": Could not switch node "' + action.nodeName + '"');
        Logger.error(e.toString());
      }
    });
  }

  return {
    name: name,
    apply: apply,
    displayName: displayName
  };
}

module.exports = Programme;
