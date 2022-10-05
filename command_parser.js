var classy = require('classy');
var _ = require('lodash');

var CommandParser = classy.define({
  programmeSelectedCallbacks: null,

  init: function() {
    this.programmeSelectedCallbacks = [];
  },

  parse: function(command) {
    var programmeRegex = /programme (.*)/;

    var match = command.match(programmeRegex);
    if (match) {
      var programmeName = match[1];

      this.callProgrammeSelectedCallbacks(programmeName);
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
