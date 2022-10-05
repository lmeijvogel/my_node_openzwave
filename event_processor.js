"use strict";

var Logger = require('./logger');
var EventEmitter = require("events").EventEmitter;

function EventProcessor(zwave, programmes, nextProgrammeChooser) {
  var eventEmitter = new EventEmitter();
  zwave.onNodeEvent(onNodeEvent);

  function onNodeEvent(node, event) {
    if (node.nodeId === 3) {
      var onOff = (event === 255) ? "on" : "off";

      mainSwitchPressed(onOff);
    } else {
      Logger.warn("Event from unexpected node ", node);
      Logger.verbose(".. event: ", event);
    }
  }

  function on(eventName, callback) {
    eventEmitter.on(eventName, callback);
  }

  function programmeSelected(programmeName) {
    var programme = programmes[programmeName];

    if (programme) {
      programme.apply(zwave);
      nextProgrammeChooser.setCurrentState(programme.name);

      eventEmitter.emit("programmeSelected", programmeName);

      Logger.info("Programme selected: %s", programmeName);
    } else {
      Logger.error("Programme '%s' not found.", programmeName);
    }
  }

  function mainSwitchPressed(onOff) {
    Logger.info("Switch pressed: "+ onOff);

    var nextProgrammeName = nextProgrammeChooser.handle(onOff);
    var nextProgramme = programmes[nextProgrammeName];

    if (!nextProgramme) {
      return;
    }

    try {
      programmeSelected(nextProgrammeName);
    } catch(e) {
      Logger.error("After switch pressed: Could not start '%s'", nextProgrammeName);
      Logger.error(e);
    }
  }

  return {
    on: on,
    programmeSelected: programmeSelected
  };
}
module.exports = EventProcessor;
