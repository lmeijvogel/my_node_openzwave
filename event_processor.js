'use strict';

const Logger = require('./logger');
const EventEmitter = require('events').EventEmitter;

class EventProcessor {
  constructor (zwave, programmes, nextProgrammeChooser) {
    this.zwave = zwave;
    this.programmes = programmes;
    this.nextProgrammeChooser = nextProgrammeChooser;

    this.eventEmitter = new EventEmitter();
  }

  on(eventName, callback) {
    this.eventEmitter.on(eventName, callback);
  }

  programmeSelected(programmeName) {
    const programme = this.programmes[programmeName];

    if (programme) {
      programme.apply(this.zwave);

      this.eventEmitter.emit('programmeSelected', programmeName);

      Logger.info('Programme selected: %s', programmeName);
    } else {
      Logger.error('Programme "%s" not found.', programmeName);
    }
  }

  mainSwitchPressed(value, currentProgramme) {
    const onOff = value === 255 ? 'on' : 'off';

    Logger.info('Switch pressed: ' + onOff);

    const nextProgrammeName = this.nextProgrammeChooser.handle(onOff, currentProgramme);
    const nextProgramme = this.programmes[nextProgrammeName];

    if (!nextProgramme) {
      return;
    }

    try {
      this.programmeSelected(nextProgrammeName);
    } catch(e) {
      Logger.error('After switch pressed: Could not start "%s"', nextProgrammeName);
      Logger.error(e);
    }
  }
}
module.exports = EventProcessor;
