'use strict';

const _ = require('lodash');
const Programme = require('./programme');

function ProgrammeFactory() {
  function build(programmesConfiguration, lights) {
    let programmes = {};

    _.each(programmesConfiguration, function (programme, name) {
      const newProgramme = new Programme(name, programme.displayName, programme.values, lights);

      programmes[name] = newProgramme;
    });

    return programmes;
  }

  return {
    build: build
  };
}

module.exports = ProgrammeFactory;
