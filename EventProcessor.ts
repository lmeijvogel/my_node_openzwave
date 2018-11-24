import { Logger } from "./Logger";
import { EventEmitter } from "events";

import { IProgramme } from "./Programme";
import { NextProgrammeChooser } from "./NextProgrammeChooser";

import { IMyZWave } from "./IMyZWave";

class EventProcessor {
  private readonly eventEmitter: EventEmitter;

  constructor(
    private readonly zwave: IMyZWave,
    private readonly programmes: IProgramme[],
    private readonly nextProgrammeChooser
  ) {
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

      this.eventEmitter.emit("programmeSelected", programmeName);

      Logger.info(`Programme selected: ${programmeName}`);
    } else {
      Logger.error(`Programme "${programmeName}" not found.`);
    }
  }

  mainSwitchPressed(value, currentProgramme) {
    const onOff = value === 255 ? "on" : "off";

    Logger.info("Switch pressed: " + onOff);

    const nextProgrammeName = this.nextProgrammeChooser.handle(onOff, currentProgramme);
    const nextProgramme = this.programmes.filter(programme => programme.name === nextProgrammeName)[0];

    if (!nextProgramme) {
      Logger.error(
        `EventProcessor.mainSwitchPressed: No next programme found for switch press ${onOff}, currentProgramme: ${currentProgramme}!`
      );
      return;
    }

    try {
      this.programmeSelected(nextProgrammeName);
    } catch (e) {
      Logger.error(`After switch pressed: Could not start "${nextProgrammeName}"`);
      Logger.error(e);
    }
  }
}
export { EventProcessor };
