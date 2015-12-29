var _ = require("lodash");
var Logger = require('./logger');

function Programme(name, displayName, data, lights) {
  function apply(zwave) {
    _.forIn(data, function (value, key) {
      var nodeid = lights[key];
      try {
        if (value === true) {
          Logger.verbose("Send command 'switch on' to node %d", nodeid);
          zwave.switchOn(nodeid);
        } else if (value === false) {
          Logger.verbose("Send command 'switch off' to node %d", nodeid);
          zwave.switchOff(nodeid);
        } else {
          Logger.verbose("Send command 'level %d' to node %d", value, nodeid);
          zwave.setLevel(nodeid, value);
        }
      }
      catch(e) {
        Logger.error("ERROR in programme '" + name + "': Could not switch node '" + key + "'");
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
