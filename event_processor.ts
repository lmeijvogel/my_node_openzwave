'use strict';

import Logger from './logger';
import { EventEmitter } from 'events';

import Programme from './programme';
import NextProgrammeChooser from './next_programme_chooser';

class EventProcessor {
  zwave: any;
  programmes : Programme[];
  nextProgrammeChooser : NextProgrammeChooser;
  eventEmitter : EventEmitter;

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
export default EventProcessor;
