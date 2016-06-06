'use strict';

const _ = require('lodash');
const Programme = require('./programme');

function ProgrammeFactory() {
  function build(config) {
    const lights = config.lights;
    let programmes = {};

    _.each(config.programmes, function (programme, name) {
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
