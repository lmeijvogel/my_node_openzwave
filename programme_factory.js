var classy = require('classy');
var Programme = require('./programme');

var ProgrammeFactory = classy.define({
  programmeChangeListener: null,

  init: function(programmeChangeListener) {
    if (programmeChangeListener) {
      this.programmeChangeListener = programmeChangeListener;
    } else {
      this.programmeChangeListener = function() {};
    }
  },

  build: function(config) {
    var lights = config.lights;

    var programmes = {};

    _(config.programmes).forIn(function(programme, name) {
      programmes[name] = new Programme(programme, lights);
    });

    return programmes;
  }
});

module.exports = ProgrammeFactory;
