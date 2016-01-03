'use strict';

const Logger = require('./logger');
const EventEmitter = require('events').EventEmitter;

function EventProcessor(zwave, programmes, nextProgrammeChooser) {
  const eventEmitter = new EventEmitter();

  zwave.onNodeEvent(onNodeEvent);

  function onNodeEvent(node, event) {
    if (node.nodeId === 3) {
      const onOff = event === 255 ? 'on' : 'off';

      mainSwitchPressed(onOff);
    } else {
      Logger.warn('Event from unexpected node ', node);
      Logger.verbose('.. event: ', event);
    }
  }

  function on(eventName, callback) {
    eventEmitter.on(eventName, callback);
  }

  function programmeSelected(programmeName) {
    const programme = programmes[programmeName];

    if (programme) {
      programme.apply(zwave);
      nextProgrammeChooser.setCurrentState(programme.name);

      eventEmitter.emit('programmeSelected', programmeName);

      Logger.info('Programme selected: %s', programmeName);
    } else {
      Logger.error('Programme "%s" not found.', programmeName);
    }
  }

  function mainSwitchPressed(onOff) {
    Logger.info('Switch pressed: ' + onOff);

    const nextProgrammeName = nextProgrammeChooser.handle(onOff);
    const nextProgramme = programmes[nextProgrammeName];

    if (!nextProgramme) {
      return;
    }

    try {
      programmeSelected(nextProgrammeName);
    } catch(e) {
      Logger.error('After switch pressed: Could not start "%s"', nextProgrammeName);
      Logger.error(e);
    }
  }

  return {
    on: on,
    programmeSelected: programmeSelected
  };
}
module.exports = EventProcessor;
