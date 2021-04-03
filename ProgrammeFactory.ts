import { forOwn } from "lodash";

import { ConfigLight } from "./ConfigLight";
import { Logger } from "./Logger";
import { Programme } from "./Programme";

type ConfigProgramme = {
    displayName: string;
    values: { [name: string]: number }
}

class ProgrammeFactory {
  build(programmesConfiguration: Map<string, ConfigProgramme>, lights: ConfigLight[]): Programme[] {
    let programmes: Programme[] = [];

    Logger.debug(`ProgrammeFactory.build: Received ${JSON.stringify([...programmesConfiguration])}`);

    programmesConfiguration.forEach((programme, name) => {
      const values: Map<string, any> = new Map<string, any>();

      forOwn(programme.values, (value, key) => {
        values.set(key, value);
      });

      const newProgramme = new Programme(name, programme.displayName, values, lights);

      programmes.push(newProgramme);
    });

    Logger.debug(`ProgrammeFactory.build: Returning: ${JSON.stringify(programmes)}`);
    return programmes;
  }
}

export { ProgrammeFactory };
