classy = require('classy');

var NextProgrammeChooser = classy.define({
  programme: null,

  setProgramme: function(programme) {
    this.programme = programme;
  },

  handle: function(event) {
    if (event == "on") {
      this.onPressed();
    } else {
      this.offPressed();
    }

    return this.programme;
  },

  onPressed: function() {
    var cycled = this.tryCycle();

    if (!cycled) {
      if (this.isEvening()) {
        this.programme = "evening";
      } else if (this.isMorning()) {
        this.programme = "morning";
      } else if (this.isNight()) {
        this.programme = "night";
      } else {
        // This should not occur, but make sure the lights can come on anyway.
        this.programme = "evening";
      }
    }
  },

  offPressed: function() {
    this.programme = "off";
  },

  tryCycle: function() {
    if (this.programme == "evening") {
      this.programme = "dimmed";
      return true;
    }

    if (this.programme == "dimmed") {
      this.programme = "evening";
      return true;
    }

    return false;
  },

  isMorning: function() {
    return (7 <= this.hour() && this.hour() < 14);
  },

  isEvening: function() {
    return (14 <= this.hour() && this.hour() < 22);
  },

  isNight: function() {
    return (this.hour() < 7 || 22 <= this.hour());
  },

  hour: function() {
    return new Date().getHours();
  }
});

exports.NextProgrammeChooser = NextProgrammeChooser;
