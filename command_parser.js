var classy = require('classy');
var _ = require('lodash');

var CommandParser = classy.define({
  programmes: null,
  programmeSelectedCallbacks: null,

  init: function(programmes) {
    this.programmes = programmes;
    this.programmeSelectedCallbacks = [];
  },

  parse: function(command) {
    var programmeRegex = /programme (.*)/;

    var match = command.match(programmeRegex);
    if (match) {
      this.callProgrammeSelectedCallbacks(match[1]);
    }
  },

  onProgrammeSelected: function(handler) {
    this.programmeSelectedCallbacks.push(handler);
  },

  callProgrammeSelectedCallbacks: function(programmeName) {
    _.each(this.programmeSelectedCallbacks, function(handler) {
      handler.call(this, programmeName);
    });
  }
});

module.exports = CommandParser;
