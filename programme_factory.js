'use strict';

const _ = require('lodash');
const Programme = require('./programme');

function ProgrammeFactory() {
  let programmeCreatedCallbacks = [];

  function build(config) {
    const lights = config.lights;
    let programmes = {};

    _.each(config.programmes, function (programme, name) {
      const newProgramme = new Programme(name, programme.displayName, programme.values, lights);

      programmes[name] = newProgramme;

      _.each(programmeCreatedCallbacks, function (callback) {
        callback(newProgramme);
      });
    });

    return programmes;
  }

  function onProgrammeCreated(callback) {
    programmeCreatedCallbacks.push(callback);
  }

  return {
    build: build,
    onProgrammeCreated: onProgrammeCreated
  };
}

module.exports = ProgrammeFactory;
