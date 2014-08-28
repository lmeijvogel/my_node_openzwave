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

  mainSwitchPressed: function(event) {
    var nextProgrammeName = this.nextProgrammeChooser.handle(event);
    var nextProgramme = this.programmes[nextProgrammeName];

    if (nextProgramme == null) {
      console.log("ERROR: Programme '"+ nextProgrammeName +"' not found.");
      return;
    }

    try {
      nextProgramme.apply(this.zwave);

      console.log(nextProgramme);
    }
    catch(e) {
      console.log("ERROR: Could not start '"+ nextProgrammeName +"'");
    }
  }
});

module.exports = EventProcessor
