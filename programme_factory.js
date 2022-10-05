var _ = require("lodash");
var Programme = require("./programme");

function ProgrammeFactory() {
  var programmeCreatedCallbacks = [];

  function build(config) {
    var lights = config.lights;
    var programmes = {};

    _.each(config.programmes, function (programme, name) {
      var newProgramme = new Programme(name, programme.displayName, programme.values, lights);
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
