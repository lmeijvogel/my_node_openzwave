'use strict';

const Logger = require('./logger');
const EventEmitter = require('events').EventEmitter;

function EventProcessor(zwave, programmes, nextProgrammeChooser) {
  const eventEmitter = new EventEmitter();

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

  function mainSwitchPressed(value) {
    const onOff = value === 255 ? 'on' : 'off';

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
    mainSwitchPressed: mainSwitchPressed,
    programmeSelected: programmeSelected
  };
}
module.exports = EventProcessor;
