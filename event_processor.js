var Node = require('./node').node;
var classy = require('classy');
var Programme = require('./programme');
var NextProgrammeChooser = require('./next_programme_chooser');
var _ = require('lodash');

var EventProcessor = classy.define({
  zwave: null,
  lights: null,
  programmes: null,
  nextProgrammeChooser: null,

  init: function(zwave, config) {
    this.zwave = zwave;
    this.lights = config.lights;
    this.programmes = {};

    var self = this;
    _(config.programmes).forIn(function(programme, name) {
      self.programmes[name] = new Programme(programme, self.lights);
    });

    this.nextProgrammeChooser = new NextProgrammeChooser();

    zwave.onEvent(this.onEvent.bind(this));
  },

  onEvent: function(node, event) {
    switch (node.nodeId) {
      case 3:
        var onOff = (event == 255) ? "on" : "off";
        this.mainSwitchPressed(onOff);
        break;
      default:
        console.log("Event from unexpected node ", node);
        console.log(".. event: ", event);
        break;
    }
  },

  mainSwitchPressed: function(event) {
    var nextProgrammeName = this.nextProgrammeChooser.handle(event);
    var nextProgramme = this.programmes[nextProgrammeName];

    nextProgramme.apply(this.zwave);

    console.log(nextProgramme);
  }
});

module.exports = EventProcessor
