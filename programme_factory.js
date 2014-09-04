var _ = require('lodash');
var classy = require('classy');
var Programme = require('./programme');

var ProgrammeFactory = classy.define({
  build: function(config) {
    var self = this;
    var lights = config.lights;

    var programmes = {};

    _(config.programmes).forIn(function(programme, name) {
      programmes[name] = new Programme(name, programme, lights);
    });

    return programmes;
  }
});

module.exports = ProgrammeFactory;
