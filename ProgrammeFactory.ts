import { forOwn } from "lodash";

import { Logger } from "./Logger";
import { Programme } from "./Programme";
import { Light } from "./Light";

class ProgrammeFactory {
  build(programmesConfiguration: Map<string, object>, lights: Map<string, Light>): Programme[] {
    let programmes: Programme[] = [];

    Logger.debug(`ProgrammeFactory.build: Received ${JSON.stringify([...programmesConfiguration])}`);

    programmesConfiguration.forEach((programme, name) => {
      const values: Map<string, any> = new Map<string, any>();

      forOwn(programme["values"], (value, key) => {
        values.set(key, value);
      });

      const newProgramme = new Programme(name, programme["displayName"], values, lights);

      programmes.push(newProgramme);
    });

    Logger.debug(`ProgrammeFactory.build: Returning: ${JSON.stringify(programmes)}`);
    return programmes;
  }
}

export { ProgrammeFactory };
