'use strict';

import { each } from 'lodash';
import Programme from './programme';

class ProgrammeFactory {
  build(programmesConfiguration, lights) {
    let programmes = {};

    each(programmesConfiguration, function (programme, name) {
      const newProgramme = new Programme(name, programme.displayName, programme.values, lights);

      programmes[name] = newProgramme;
    });

    return programmes;
  }
}

export default ProgrammeFactory;
