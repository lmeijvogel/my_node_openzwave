import { Logger } from "./Logger";
import { EventEmitter } from "events";

import { IProgramme } from "./Programme";
import { NextProgrammeChooser } from "./NextProgrammeChooser";
import { SwitchPressName } from "./SwitchPressName";

import { IMyZWave } from "./IMyZWave";

class EventProcessor {
  private readonly eventEmitter: EventEmitter;

  constructor(
    private readonly zwave: IMyZWave,
    private readonly programmes: IProgramme[],
    private readonly nextProgrammeChooser: NextProgrammeChooser
  ) {
    this.programmes = programmes;
    this.nextProgrammeChooser = nextProgrammeChooser;

    this.eventEmitter = new EventEmitter();
  }

  on(eventName: string, callback: (...args: any[]) => void) {
    this.eventEmitter.on(eventName, callback);
  }

  programmeSelected(programmeName: string) {
    const programme = this.programmes.find(programme => programme.name === programmeName);

    if (programme) {
      programme.apply(this.zwave);

      this.eventEmitter.emit("programmeSelected", programmeName);

      Logger.info(`Programme selected: ${programmeName}`);
    } else {
      Logger.error(`Programme "${programmeName}" not found.`);
    }
  }

  mainSwitchPressed(switchPressName: SwitchPressName, currentProgramme: string) {
    this.handleSwitchPressed(switchPressName, currentProgramme);
  }

  auxSwitchPressed(currentProgramme: string) {
    const nextProgrammeName = this.nextProgrammeChooser.handleAuxPress(currentProgramme);

    try {
      this.programmeSelected(nextProgrammeName);
    } catch (e) {
      Logger.error(`After switch pressed: Could not start "${nextProgrammeName}"`);
      Logger.error(e);
    }
  }

  private handleSwitchPressed(switchPressName: SwitchPressName, currentProgramme: string) {
    const nextProgrammeName = this.nextProgrammeChooser.handle(switchPressName, currentProgramme);
    const nextProgramme = this.programmes.filter(programme => programme.name === nextProgrammeName)[0];

    if (!nextProgramme) {
      Logger.error(
        `EventProcessor.mainSwitchPressed: No next programme found for switch press ${switchPressName}, currentProgramme: ${currentProgramme}!`
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
