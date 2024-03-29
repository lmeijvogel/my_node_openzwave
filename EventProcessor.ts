import { EventEmitter } from "events";

import { Logger } from "./Logger";
import { Configuration } from "./Configuration";
import { IProgramme } from "./Programme";

import { NextProgrammeChooser } from "./NextProgrammeChooser";
import { SwitchPressName } from "./SwitchPressName";

class EventProcessor {
  private readonly eventEmitter: EventEmitter;

  constructor(
    private readonly config: Pick<Configuration, "programmes">,
    private readonly nextProgrammeChooser: NextProgrammeChooser,
    private readonly onProgrammeApply: (programme: IProgramme) => void
  ) {
    this.eventEmitter = new EventEmitter();
  }

  on(eventName: string, callback: (...args: any[]) => void) {
    this.eventEmitter.on(eventName, callback);
  }

  programmeSelected(programmeName: string) {
    const programme = this.config.programmes.find(programme => programme.name === programmeName);

    if (programme) {
      this.onProgrammeApply(programme);

      this.eventEmitter.emit("programmeSelected", programmeName);

      Logger.info(`Programme selected: ${programmeName}`);
    } else {
      Logger.error(`Programme "${programmeName}" not found.`);
    }
  }

  mainSwitchPressed(switchPressName: SwitchPressName, currentProgrammeName: string | null) {
    this.handleSwitchPressed(switchPressName, currentProgrammeName);
  }

  auxSwitchPressed(currentProgrammeName: string | null) {
    const nextProgrammeName = this.nextProgrammeChooser.handleAuxPress(currentProgrammeName);

    try {
      this.programmeSelected(nextProgrammeName);
    } catch (e) {
      Logger.error(`After switch pressed: Could not start "${nextProgrammeName}"`);
      Logger.error(e);
    }
  }

  private handleSwitchPressed(switchPressName: SwitchPressName, currentProgrammeName: string | null) {
    const nextProgrammeName = this.nextProgrammeChooser.handle(switchPressName, currentProgrammeName);

    if (!nextProgrammeName) {
      Logger.error(
        `EventProcessor.mainSwitchPressed: No next programmeName found for switch press ${switchPressName}, currentProgrammeName: ${currentProgrammeName}!`
      );
      return;
    }

    const nextProgramme = this.config.programmes.find(programme => programme.name === nextProgrammeName);

    if (!nextProgramme) {
      Logger.error(
        `EventProcessor.mainSwitchPressed: No corresponding programme found nextProgrammeName = ${nextProgrammeName}!`
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
