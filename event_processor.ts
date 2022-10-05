import { Logger } from './logger';
import { EventEmitter } from 'events';

import { IProgramme } from './programme';
import { NextProgrammeChooser } from './next_programme_chooser';

import { OpenZWave } from 'openzwave-shared';
import { FakeZWave } from './fake_zwave';

class EventProcessor {
  zwave: FakeZWave | OpenZWave;
  programmes : IProgramme[];
  nextProgrammeChooser : NextProgrammeChooser;
  eventEmitter : EventEmitter;

  constructor(zwave : FakeZWave | OpenZWave, programmes : IProgramme[], nextProgrammeChooser) {
    this.zwave = zwave;
    this.programmes = programmes;
    this.nextProgrammeChooser = nextProgrammeChooser;

    this.eventEmitter = new EventEmitter();
  }

  on(eventName, callback) {
    this.eventEmitter.on(eventName, callback);
  }

  programmeSelected(programmeName) {
    const programme = this.programmes.find(programme => programme.name === programmeName);

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
    const nextProgramme = this.programmes.filter(programme => programme.name === nextProgrammeName)[0];

    if (!nextProgramme) {
      Logger.error('EventProcessor.mainSwitchPressed: No next programme found for switch press', onOff, ', currentProgramme:', currentProgramme, '!');
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
export { EventProcessor };
