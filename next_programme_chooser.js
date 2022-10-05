classy = require('classy');

var NextProgrammeChooser = classy.define({
  programme: null,

  setProgramme: function(programme) {
    this.programme = programme;
  },

  handle: function(event) {
    if (event == "on") {
      return this.onPressed();
    } else {
      return this.offPressed();
    }
  },

  onPressed: function() {
    var cycledProgramme = this.tryCycle();

    if (cycledProgramme != null) {
      return cycledProgramme;
    }

    if (this.isEvening()) {
      return "evening";
    } else if (this.isMorning()) {
      return "morning";
    } else if (this.isNight()) {
      return "night";
    } else {
      // This should not occur, but make sure the lights can come on anyway.
      return "evening";
    }
  },

  offPressed: function() {
    return "off";
  },

  tryCycle: function() {
    if (this.programme == "evening") {
      return "dimmed";
    }

    if (this.programme == "dimmed") {
      return "evening";
    }

    return null;
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

module.exports = NextProgrammeChooser;
