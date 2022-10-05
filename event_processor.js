var classy = require('classy');
var NextProgrammeChooser = require('./next_programme_chooser');
var _ = require('lodash');

var EventProcessor = classy.define({
  zwave: null,
  programmes: null,
  nextProgrammeChooser: null,

  init: function(zwave, programmes) {
    this.zwave = zwave;
    this.programmes = programmes;

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

  programmeSelected: function(programmeName) {
    var programme = this.programmes[programmeName];

    if (programme) {
      programme.apply(this.zwave);
      this.nextProgrammeChooser.setProgramme(programme);

      console.log("Programme selected:", programmeName);
    } else {
      console.log("ERROR: Programme '"+ programmeName +"' not found.");
    }
  },

  mainSwitchPressed: function(event) {
    var nextProgrammeName = this.nextProgrammeChooser.handle(event);
    var nextProgramme = this.programmes[nextProgrammeName];

    if (nextProgramme == null) {
      return;
    }

    try {
      this.programmeSelected(nextProgrammeName);
    }
    catch(e) {
      console.log("ERROR: Could not start '"+ nextProgrammeName +"'");
      console.log(e);
    }
  }
});

module.exports = EventProcessor
