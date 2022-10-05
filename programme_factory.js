'use strict';

const _ = require('lodash');
const Programme = require('./programme');

class ProgrammeFactory {
  build(programmesConfiguration, lights) {
    let programmes = {};

    _.each(programmesConfiguration, function (programme, name) {
      const newProgramme = new Programme(name, programme.displayName, programme.values, lights);

      programmes[name] = newProgramme;
    });

    return programmes;
  }
}

module.exports = ProgrammeFactory;
